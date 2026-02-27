"""
Attendance Kiosk Server
======================
Local Flask server that runs on the desktop PC.
Employees connect via http://localhost:8080 on any device on the same network.
Attendance is stored in SQLite and synced to the cloud when internet is available.
"""

import json, os, sqlite3, threading, time, webbrowser
from datetime import date, datetime
from contextlib import contextmanager
from flask import Flask, request, jsonify, render_template, redirect, url_for

try:
    import requests
    REQUESTS_OK = True
except ImportError:
    REQUESTS_OK = False

# ── Config ─────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(BASE_DIR, 'config.json')
DB_PATH = os.path.join(BASE_DIR, 'attendance.db')

def load_config():
    with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

cfg = load_config()

app = Flask(__name__, template_folder='templates', static_folder='static')

# ── Database ────────────────────────────────
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    db = get_db()
    db.executescript("""
        CREATE TABLE IF NOT EXISTS employees (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            job_title TEXT DEFAULT '',
            work_start_time TEXT DEFAULT '09:00',
            work_end_time TEXT DEFAULT '17:00',
            late_threshold_minutes INTEGER DEFAULT 15,
            off_days TEXT DEFAULT '[5,6]',
            is_active INTEGER DEFAULT 1,
            last_synced_at TEXT
        );
        CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_id INTEGER NOT NULL,
            attendance_date TEXT NOT NULL,
            check_in_time TEXT,
            check_out_time TEXT,
            status TEXT DEFAULT 'present',
            source TEXT DEFAULT 'kiosk',
            synced INTEGER DEFAULT 0,
            notes TEXT DEFAULT '',
            UNIQUE(employee_id, attendance_date)
        );
        CREATE TABLE IF NOT EXISTS sync_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            synced_at TEXT,
            records_count INTEGER,
            success INTEGER,
            message TEXT
        );
    """)
    db.commit()
    db.close()

def calculate_status(check_in: str, work_start: str, threshold: int) -> str:
    if not check_in:
        return 'absent'
    if not work_start:
        return 'present'
    try:
        ci_h, ci_m = map(int, check_in.split(':'))
        ws_h, ws_m = map(int, work_start.split(':'))
        ci_mins = ci_h * 60 + ci_m
        ws_mins = ws_h * 60 + ws_m
        return 'late' if (ci_mins - ws_mins) > threshold else 'present'
    except:
        return 'present'

# ── Routes ──────────────────────────────────
@app.route('/')
def index():
    db = get_db()
    employees = db.execute(
        "SELECT * FROM employees WHERE is_active=1 ORDER BY name"
    ).fetchall()
    today = date.today().isoformat()
    attendance = db.execute(
        "SELECT * FROM attendance WHERE attendance_date=?", (today,)
    ).fetchall()
    db.close()
    att_map = {a['employee_id']: dict(a) for a in attendance}
    sync_status = get_sync_status()
    return render_template('index.html',
        employees=[dict(e) for e in employees],
        att_map=att_map,
        today=today,
        company=cfg.get('company_name', 'شركتي'),
        sync_status=sync_status
    )

@app.route('/checkin', methods=['POST'])
def checkin():
    data = request.get_json()
    emp_id = int(data['employee_id'])
    today = date.today().isoformat()
    now_time = datetime.now().strftime('%H:%M')

    db = get_db()
    emp = db.execute("SELECT * FROM employees WHERE id=?", (emp_id,)).fetchone()
    if not emp:
        db.close()
        return jsonify({'error': 'موظف غير موجود'}), 404

    existing = db.execute(
        "SELECT * FROM attendance WHERE employee_id=? AND attendance_date=?",
        (emp_id, today)
    ).fetchone()

    off_days = json.loads(emp['off_days'] or '[5,6]')
    weekday = date.today().weekday()  # 0=Mon...6=Sun; python
    # Convert Python weekday (Mon=0) to JS-style (Sun=0)
    js_weekday = (weekday + 1) % 7
    is_off_day = js_weekday in off_days

    if not existing:
        # First punch = check-in
        status = calculate_status(now_time, emp['work_start_time'], emp['late_threshold_minutes'])
        if is_off_day:
            status = 'present'  # working on off-day is fine
        db.execute(
            """INSERT INTO attendance (employee_id, attendance_date, check_in_time, status, synced)
               VALUES (?,?,?,?,0) ON CONFLICT(employee_id,attendance_date)
               DO UPDATE SET check_in_time=excluded.check_in_time, status=excluded.status, synced=0""",
            (emp_id, today, now_time, status)
        )
        action = 'check_in'
    else:
        # Second punch = check-out
        db.execute(
            "UPDATE attendance SET check_out_time=?, synced=0 WHERE employee_id=? AND attendance_date=?",
            (now_time, emp_id, today)
        )
        action = 'check_out'

    db.commit()
    record = db.execute(
        "SELECT * FROM attendance WHERE employee_id=? AND attendance_date=?",
        (emp_id, today)
    ).fetchone()
    db.close()

    return jsonify({
        'success': True,
        'action': action,
        'record': dict(record),
        'employee_name': emp['name'],
        'time': now_time
    })

@app.route('/api/employees')
def api_employees():
    db = get_db()
    employees = db.execute("SELECT * FROM employees WHERE is_active=1 ORDER BY name").fetchall()
    db.close()
    return jsonify([dict(e) for e in employees])

@app.route('/api/today')
def api_today():
    db = get_db()
    today = date.today().isoformat()
    attendance = db.execute(
        """SELECT a.*, e.name, e.job_title FROM attendance a
           JOIN employees e ON a.employee_id=e.id
           WHERE a.attendance_date=? ORDER BY a.check_in_time""", (today,)
    ).fetchall()
    db.close()
    return jsonify([dict(r) for r in attendance])

@app.route('/admin')
def admin():
    db = get_db()
    today = date.today().isoformat()
    employees = db.execute("SELECT * FROM employees ORDER BY name").fetchall()
    todays_att = db.execute(
        """SELECT a.*, e.name, e.job_title FROM attendance a
           JOIN employees e ON a.employee_id=e.id
           WHERE a.attendance_date=? ORDER BY e.name""", (today,)
    ).fetchall()
    unsynced = db.execute("SELECT COUNT(*) as cnt FROM attendance WHERE synced=0").fetchone()
    sync_logs = db.execute("SELECT * FROM sync_log ORDER BY id DESC LIMIT 10").fetchall()
    db.close()
    return render_template('admin.html',
        employees=[dict(e) for e in employees],
        todays_att=[dict(r) for r in todays_att],
        unsynced_count=unsynced['cnt'],
        sync_logs=[dict(r) for r in sync_logs],
        today=today,
        company=cfg.get('company_name', 'شركتي')
    )

@app.route('/sync_now', methods=['POST'])
def sync_now():
    result = do_sync()
    return jsonify(result)

@app.route('/refresh_employees', methods=['POST'])
def refresh_employees():
    result = sync_employees_from_cloud()
    return jsonify(result)

# ── Sync Logic ──────────────────────────────
def has_internet():
    if not REQUESTS_OK:
        return False
    try:
        requests.get('https://8.8.8.8', timeout=3)
        return True
    except:
        try:
            requests.head('https://google.com', timeout=4)
            return True
        except:
            return False

def get_sync_status():
    db = get_db()
    unsynced = db.execute("SELECT COUNT(*) as cnt FROM attendance WHERE synced=0").fetchone()
    last_sync = db.execute("SELECT * FROM sync_log ORDER BY id DESC LIMIT 1").fetchone()
    db.close()
    return {
        'unsynced_count': unsynced['cnt'],
        'last_sync': dict(last_sync) if last_sync else None
    }

def do_sync():
    if not REQUESTS_OK:
        return {'success': False, 'message': 'مكتبة requests غير مثبتة'}

    cloud_url = cfg.get('cloud_base_url', '').rstrip('/')
    if not cloud_url:
        return {'success': False, 'message': 'cloud_base_url غير مضبوط في config.json'}

    if not has_internet():
        return {'success': False, 'message': 'لا يوجد اتصال بالإنترنت'}

    db = get_db()
    unsynced = db.execute(
        "SELECT * FROM attendance WHERE synced=0"
    ).fetchall()

    if not unsynced:
        db.close()
        return {'success': True, 'message': 'لا توجد سجلات جديدة للمزامنة', 'count': 0}

    payload = []
    for row in unsynced:
        payload.append({
            'employee_id': row['employee_id'],
            'attendance_date': row['attendance_date'],
            'check_in_time': row['check_in_time'],
            'check_out_time': row['check_out_time'],
            'status': row['status'],
            'source': 'kiosk',
            'notes': row['notes'] or ''
        })

    try:
        resp = requests.post(
            f"{cloud_url}/api/hr/attendance/sync",
            json=payload,
            headers={'Authorization': f"Bearer {cfg.get('sync_api_key', '')}"},
            timeout=15
        )
        if resp.status_code == 200:
            ids = [r['id'] for r in unsynced]
            db.execute(
                f"UPDATE attendance SET synced=1 WHERE id IN ({','.join('?'*len(ids))})",
                ids
            )
            db.execute(
                "INSERT INTO sync_log (synced_at, records_count, success, message) VALUES (?,?,?,?)",
                (datetime.now().isoformat(), len(payload), 1, f'تم مزامنة {len(payload)} سجل')
            )
            db.commit()
            db.close()
            return {'success': True, 'message': f'تم مزامنة {len(payload)} سجل بنجاح', 'count': len(payload)}
        else:
            msg = f'فشل: {resp.status_code} — {resp.text[:200]}'
            db.execute("INSERT INTO sync_log VALUES (NULL,?,?,?,?)",
                      (datetime.now().isoformat(), 0, 0, msg))
            db.commit()
            db.close()
            return {'success': False, 'message': msg}
    except Exception as e:
        db.execute("INSERT INTO sync_log VALUES (NULL,?,?,?,?)",
                  (datetime.now().isoformat(), 0, 0, str(e)))
        db.commit()
        db.close()
        return {'success': False, 'message': str(e)}

def sync_employees_from_cloud():
    """Pull latest employee list from Supabase directly."""
    if not REQUESTS_OK:
        return {'success': False, 'message': 'requests غير مثبتة'}
    cloud_url = cfg.get('cloud_base_url', '').rstrip('/')
    if not cloud_url or not has_internet():
        return {'success': False, 'message': 'لا اتصال أو cloud_base_url غير مضبوط'}
    try:
        resp = requests.get(
            f"{cloud_url}/api/hr/employees",
            headers={'Authorization': f"Bearer {cfg.get('sync_api_key', '')}"},
            timeout=10
        )
        if resp.status_code == 200:
            employees = resp.json()
            db = get_db()
            for emp in employees:
                off_days = json.dumps(emp.get('off_days') or [5, 6])
                db.execute("""
                    INSERT INTO employees (id, name, job_title, work_start_time, work_end_time,
                        late_threshold_minutes, off_days, is_active, last_synced_at)
                    VALUES (?,?,?,?,?,?,?,?,?)
                    ON CONFLICT(id) DO UPDATE SET
                        name=excluded.name, job_title=excluded.job_title,
                        work_start_time=excluded.work_start_time,
                        work_end_time=excluded.work_end_time,
                        late_threshold_minutes=excluded.late_threshold_minutes,
                        off_days=excluded.off_days,
                        is_active=excluded.is_active,
                        last_synced_at=excluded.last_synced_at
                """, (emp['id'], emp['name'], emp.get('job_title',''),
                      emp.get('work_start_time','09:00'), emp.get('work_end_time','17:00'),
                      emp.get('late_threshold_minutes', 15), off_days,
                      1 if emp.get('is_active', True) else 0,
                      datetime.now().isoformat()))
            db.commit()
            db.close()
            return {'success': True, 'message': f'تم تحديث {len(employees)} موظف', 'count': len(employees)}
        return {'success': False, 'message': f'فشل: {resp.status_code}'}
    except Exception as e:
        return {'success': False, 'message': str(e)}

def background_sync_loop():
    """Background thread: sync every 30 seconds, and refresh employees."""
    loops = 0
    while True:
        time.sleep(30)  # 30 seconds
        loops += 1
        try:
            do_sync()
            # Refresh employees every 10 loops (5 minutes)
            if loops >= 10:
                sync_employees_from_cloud()
                loops = 0
        except:
            pass

# ── Main ────────────────────────────────────
if __name__ == '__main__':
    init_db()
    # Start background sync thread
    sync_thread = threading.Thread(target=background_sync_loop, daemon=True)
    sync_thread.start()
    port = cfg.get('kiosk_port', 8080)
    print(f"\n{'='*50}")
    print(f"  🏢 نظام تسجيل الحضور")
    print(f"  رابط الكيوسك: http://localhost:{port}")
    print(f"  لوحة الإدارة: http://localhost:{port}/admin")
    print(f"{'='*50}\n")
    # Open browser automatically
    threading.Timer(1.5, lambda: webbrowser.open(f'http://localhost:{port}')).start()
    app.run(host='0.0.0.0', port=port, debug=False, use_reloader=False)
