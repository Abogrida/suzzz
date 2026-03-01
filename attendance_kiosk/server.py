"""
Attendance Kiosk Server
======================
Local Flask server that runs on the desktop PC.
Employees connect via http://localhost:8080 on any device on the same network.
Attendance is stored in SQLite and synced to the cloud when internet is available.
"""

import json, os, sqlite3, threading, time, webbrowser, socket
from datetime import date, datetime, timedelta
from contextlib import contextmanager
from flask import Flask, request, jsonify, render_template, redirect, url_for, session

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
app.secret_key = 'suzz-inventory-kiosk-secret'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=12)

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

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
            off_days TEXT DEFAULT '[]',
            is_active INTEGER DEFAULT 1,
            pin_code TEXT DEFAULT '0000',
            phone TEXT DEFAULT '',
            device_id TEXT,
            last_synced_at TEXT
        );
    """)
    # Ensure phone column exists for existing DBs
    try:
        db.execute("ALTER TABLE employees ADD COLUMN phone TEXT DEFAULT ''")
    except:
        pass
    db.execute('''
        CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_id INTEGER NOT NULL,
            attendance_date TEXT NOT NULL,
            check_in_time TEXT,
            check_out_time TEXT,
            status TEXT NOT NULL,
            synced INTEGER DEFAULT 0
        )
    ''')
    db.execute('''
        CREATE TABLE IF NOT EXISTS sync_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            synced_at TEXT NOT NULL,
            records_count INTEGER NOT NULL,
            success INTEGER NOT NULL,
            message TEXT
        )
    ''')
    db.execute('''
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    ''')
    db.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT,
            barcode TEXT,
            sku TEXT,
            price REAL DEFAULT 0,
            active INTEGER DEFAULT 1,
            unit TEXT
        )
    ''')
    db.execute('''
        CREATE TABLE IF NOT EXISTS offline_counts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_id INTEGER,
            count_date TEXT,
            shift TEXT,
            branch TEXT,
            items_json TEXT,
            synced INTEGER DEFAULT 0,
            created_at TEXT
        )
    ''')
    
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
    emp_id = session.get('employee_id')
    dev_id = session.get('device_id')
    if not emp_id or not dev_id:
        return redirect(url_for('login'))
        
    db = get_db()
    # Security: Verify device_id is still linked to this employee
    emp = db.execute("SELECT * FROM employees WHERE id=? AND device_id=? AND is_active=1", (emp_id, dev_id)).fetchone()
    
    if not emp:
        db.close()
        session.clear()
        return redirect(url_for('login'))

    today = date.today().isoformat()
    # Get latest attendance session for today that isn't fully closed
    attendance = db.execute("""
        SELECT * FROM attendance 
        WHERE employee_id = ? AND attendance_date = ? 
        ORDER BY id DESC LIMIT 1
    """, (emp['id'], today)).fetchone()
    
    if attendance and attendance['check_out_time']:
        active_attendance = None
    else:
        active_attendance = attendance

    sync_status = get_sync_status()
    port = cfg.get('kiosk_port', 8085)
    network_url = f"http://{get_local_ip()}:{port}"
    db.close()
    
    return render_template('dashboard.html', 
                           employee=dict(emp), 
                           attendance=active_attendance, 
                           company=cfg.get('company_name', 'Suzz Inventory'),
                           sync_status=sync_status,
                           network_url=network_url)

@app.route('/login', methods=['GET'])
def login():
    port = cfg.get('kiosk_port', 8080)
    network_url = f"http://{get_local_ip()}:{port}"
    db = get_db()
    employees = db.execute("SELECT id, name FROM employees WHERE is_active=1 ORDER BY name").fetchall()
    db.close()
    return render_template('login.html', employees=[dict(e) for e in employees], company=cfg.get('company_name', 'Suzz'), network_url=network_url)

@app.route('/login_and_link', methods=['POST'])
def login_and_link():
    data = request.json
    identifier = str(data.get('identifier', '')).strip()
    pin = str(data.get('pin', '')).strip()
    device_id = str(data.get('device_id', ''))
    
    db = get_db()
    
    # We strip both sides in Python, but DB might have trailing spaces like "صلاح "
    if identifier.isdigit():
        emp = db.execute("SELECT * FROM employees WHERE (TRIM(name)=? OR TRIM(phone)=? OR id=?) AND is_active=1", (identifier, identifier, int(identifier))).fetchone()
    else:
        emp = db.execute("SELECT * FROM employees WHERE (TRIM(name)=? OR TRIM(phone)=?) AND is_active=1", (identifier, identifier)).fetchone()
        
    if emp and str(emp['pin_code']).strip() == pin:
        # Check if already linked to another device
        if emp['device_id'] and emp['device_id'] != device_id:
            db.close()
            return jsonify({
                'success': False, 
                'error': 'هذا الحساب مربوط بجهاز آخر بالفعل. يرجى مراجعة الأدمن لفك الارتباط.'
            }), 403

        # Link device locally
        db.execute("UPDATE employees SET device_id=? WHERE id=?", (device_id, emp['id']))
        db.commit()
        db.close()
        try_sync_device_id_to_cloud(emp['id'], device_id)
        
        session.permanent = True
        session['employee_id'] = emp['id']
        session['employee_name'] = emp['name']
        session['device_id'] = device_id
        return jsonify({'success': True, 'emp_id': emp['id']})
        
    db.close()
    return jsonify({'success': False, 'error': 'الاسم/الرقم أو الرمز السري غير صحيح'})

@app.route('/api/auto_login', methods=['POST'])
def auto_login():
    data = request.json
    emp_id = data.get('employee_id')
    device_id = data.get('device_id')
    
    if not emp_id or not device_id:
        return jsonify({'success': False})
        
    db = get_db()
    emp = db.execute("SELECT * FROM employees WHERE id=? AND device_id=? AND is_active=1", (emp_id, device_id)).fetchone()
    db.close()
    
    if emp:
        session.permanent = True
        session['employee_id'] = emp['id']
        session['employee_name'] = emp['name']
        return jsonify({'success': True})
    return jsonify({'success': False})

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

@app.route('/inventory')
def inventory():
    emp_id = session.get('employee_id')
    dev_id = session.get('device_id')
    if not emp_id or not dev_id:
        return redirect(url_for('login'))
        
    db = get_db()
    emp = db.execute("SELECT * FROM employees WHERE id=? AND device_id=? AND is_active=1", (emp_id, dev_id)).fetchone()
    if not emp:
        db.close()
        session.clear()
        return redirect(url_for('login'))
        
    products = db.execute("SELECT * FROM products WHERE active=1 ORDER BY category, name").fetchall()
    db.close()
    return render_template('inventory.html',
        products=[dict(p) for p in products],
        employee=dict(emp),
        company=cfg.get('company_name', 'Suzz Inventory')
    )

@app.route('/api/local/inventory', methods=['POST'])
def save_local_inventory():
    if not session.get('employee_id'):
        return jsonify({'error': 'Unauthorized'}), 401
        
    data = request.json
    db = get_db()
    count_timestamp = datetime.now().isoformat()
    branch = data.get('branch', 'Suzz 1')
    shift = data.get('shift', 'morning')
    count_date = data.get('count_date', date.today().isoformat())
    items_json = json.dumps(data.get('items', []))
    
    db.execute('''
        INSERT INTO offline_counts (employee_id, count_date, shift, branch, items_json, created_at, synced)
        VALUES (?, ?, ?, ?, ?, ?, 0)
    ''', (session['employee_id'], count_date, shift, branch, items_json, count_timestamp))
    
    db.commit()
    db.close()
    return jsonify({'success': True})

@app.route('/api/local/my_counts', methods=['GET'])
def get_my_counts():
    if not session.get('employee_id'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    count_date = request.args.get('count_date', date.today().isoformat())
    db = get_db()
    
    counts = db.execute('''
        SELECT oc.created_at, oc.items_json, oc.shift, oc.branch, e.name as employee_name
        FROM offline_counts oc
        JOIN employees e ON oc.employee_id = e.id
        WHERE oc.count_date = ?
        ORDER BY oc.id DESC
    ''', (count_date,)).fetchall()
    db.close()
    
    result = []
    for c in counts:
        try:
            items = json.loads(c['items_json'])
            item_count = len(items)
        except:
            items = []
            item_count = 0
            
        result.append({
            'created_at': c['created_at'],
            'employee_name': c['employee_name'],
            'items_counted': item_count,
            'items': items,
            'branch': c['branch'],
            'shift': c['shift']
        })
        
    return jsonify(result)

@app.route('/link_device', methods=['POST'])
def link_device():
    data = request.get_json()
    emp_id = int(data.get('employee_id', 0))
    pin_code = str(data.get('pin_code', ''))
    device_id = str(data.get('device_id', ''))
    
    db = get_db()
    emp = db.execute("SELECT * FROM employees WHERE id=?", (emp_id,)).fetchone()
    
    if not emp:
        db.close()
        return jsonify({'success': False, 'message': 'موظف غير موجود'}), 404
        
    if str(emp['pin_code']) != pin_code:
        db.close()
        return jsonify({'success': False, 'message': 'الرمز السري غير صحيح'}), 401
        
    # Correct PIN. Link the device locally.
    db.execute("UPDATE employees SET device_id=? WHERE id=?", (device_id, emp_id))
    db.commit()
    db.close()
    
    # We will also try to sync this device_id to the cloud
    try_sync_device_id_to_cloud(emp_id, device_id)
    
    return jsonify({
        'success': True,
        'message': 'تم ربط الجهاز بنجاح',
        'employee_name': emp['name']
    })

@app.route('/verify_link', methods=['POST'])
def verify_link():
    data = request.json or {}
    try:
        emp_id = int(data.get('employee_id', 0))
    except:
        emp_id = 0
    dev_id = data.get('device_id')
    if not emp_id or not dev_id:
        return jsonify({'linked': False})
    
    db = get_db()
    emp = db.execute("SELECT device_id FROM employees WHERE id=?", (emp_id,)).fetchone()
    db.close()
    
    # Check if the device_id in DB matches the one from the request
    is_linked = emp and emp['device_id'] == dev_id
    return jsonify({'linked': bool(is_linked)})

def try_sync_device_id_to_cloud(emp_id, device_id):
    if not REQUESTS_OK or not has_internet():
        return
    cloud_url = cfg.get('cloud_base_url', '').rstrip('/')
    if not cloud_url:
        return
    try:
        # We only update the device_id in the cloud to avoid overwriting other fields
        requests.put(
            f"{cloud_url}/api/hr/employees/{emp_id}",
            json={'device_id': device_id},
            headers={'Authorization': f"Bearer {cfg.get('sync_api_key', '')}"},
            timeout=5
        )
    except:
        pass

def try_unlink_device_on_cloud(emp_id):
    if not REQUESTS_OK or not has_internet():
        return
    cloud_url = cfg.get('cloud_base_url', '').rstrip('/')
    if not cloud_url:
        return
    try:
        requests.put(
            f"{cloud_url}/api/hr/employees/{emp_id}",
            json={'device_id': None},
            headers={'Authorization': f"Bearer {cfg.get('sync_api_key', '')}"},
            timeout=5
        )
    except Exception as e:
        print(f"Error unlinking on cloud: {e}")


@app.route('/checkin', methods=['POST'])
def checkin():
    try:
        data = request.get_json()
        
        # Pull from session primarily now (Dashboard auth)
        if session.get('employee_id'):
            emp_id = session['employee_id']
            is_authorized = True
        else:
            emp_id = int(data.get('employee_id', 0))
            is_authorized = False
            
        device_id = str(data.get('device_id', ''))
        pin_code = str(data.get('pin_code', ''))
        today = date.today().isoformat()
        now_time = datetime.now().strftime('%H:%M')

        db = get_db()
        emp = db.execute("SELECT * FROM employees WHERE id=?", (emp_id,)).fetchone()
        if not emp:
            db.close()
            return jsonify({'error': 'موظف غير موجود'}), 404
            
        # Check if the punch is authorized by PIN or by a linked device ID
        if not is_authorized:
            is_pin_correct = (str(emp['pin_code']) == pin_code)
            is_device_linked = (str(emp['device_id']) == device_id and device_id != 'local_kiosk' and device_id != '')

            if not is_pin_correct and not is_device_linked:
                db.close()
                return jsonify({'error': 'الرمز السري (PIN) غير صحيح'}), 403

        # Find latest session for this employee today
        existing = db.execute("""
            SELECT * FROM attendance 
            WHERE employee_id = ? AND attendance_date = ? 
            ORDER BY id DESC LIMIT 1
        """, (emp_id, today)).fetchone()

        off_days = json.loads(emp['off_days'] or '[]')
        weekday = date.today().weekday()  # 0=Mon...6=Sun; python
        # Convert Python weekday (Mon=0) to JS-style (Sun=0)
        js_weekday = (weekday + 1) % 7
        is_off_day = js_weekday in off_days

        if not existing or existing['check_out_time']:
            # First punch OR new cycle after checkout
            status = calculate_status(now_time, emp['work_start_time'], emp['late_threshold_minutes'])
            if is_off_day:
                status = 'present'
            
            # Since attendance_date + employee_id is UNIQUE, we might need to handle 
            # multiple sessions differently if we want to store them in the SAME table.
            # HOWEVER, the table schema has UNIQUE(employee_id, attendance_date).
            # This means we CANNOT have multiple records for the same day in this table.
            # I will check if I should remove the UNIQUE constraint or just stick to 
            # the single-record "resume" logic but without the "re-check in" text.
            
            if not existing:
                db.execute(
                    """INSERT INTO attendance (employee_id, attendance_date, check_in_time, status, synced)
                       VALUES (?,?,?,?,0)""",
                    (emp_id, today, now_time, status)
                )
            else:
                # If we're starting a "new cycle" but constraint exists, 
                # we technically just update the check_out_time to NULL and 
                # keep the original check_in_time? 
                # User asked to: "ظهرلك تسجيل حضور طبيعي وبعدها يتسجل فالسيستم انك سجلت حضور تاني وانصراف"
                # This implies separate records. I will remove the UNIQUE constraint.
                db.execute(
                    """INSERT INTO attendance (employee_id, attendance_date, check_in_time, status, synced)
                       VALUES (?,?,?,?,0)""",
                    (emp_id, today, now_time, status)
                )
            action = 'check_in'
        else:
            # Second punch = check-out
            db.execute(
                "UPDATE attendance SET check_out_time=?, synced=0 WHERE id=?",
                (now_time, existing['id'])
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
    except Exception as e:
        print(f"Error in checkin: {e}")
        return jsonify({'error': f'حدث خطأ في السيرفر: {str(e)}'}), 500

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
    pin = request.args.get('pin')
    db = get_db()
    
    # Check PIN
    admin_pin_row = db.execute("SELECT value FROM settings WHERE key='admin_pin'").fetchone()
    expected_pin = admin_pin_row['value'] if admin_pin_row else '1234'
    
    if pin != expected_pin:
        db.close()
        return "غير مصرح لك بالدخول", 401

    today = date.today().isoformat()
    # Support filtering in the backend, or just send everything to frontend
    # Since it's a kiosk, sending all attendance is fine for local SQLite
    employees = db.execute("SELECT * FROM employees ORDER BY name").fetchall()
    all_attendance = db.execute(
        """SELECT a.*, e.name, e.job_title FROM attendance a
           JOIN employees e ON a.employee_id=e.id
           ORDER BY a.attendance_date DESC, e.name"""
    ).fetchall()
    unsynced = db.execute("SELECT COUNT(*) as cnt FROM attendance WHERE synced=0").fetchone()
    sync_logs = db.execute("SELECT * FROM sync_log ORDER BY id DESC LIMIT 10").fetchall()
    db.close()
    
    return render_template('admin.html',
        employees=[dict(e) for e in employees],
        all_attendance=[dict(r) for r in all_attendance],
        unsynced_count=unsynced['cnt'],
        sync_logs=[dict(r) for r in sync_logs],
        today=today,
        company=cfg.get('company_name', 'Suzz'),
        pin=pin
    )

@app.route('/api/admin/employee/update', methods=['POST'])
def admin_update_employee():
    try:
        data = request.json or {}
        admin_pin = data.get('admin_pin')
        emp_id = data.get('id')
        name = data.get('name')
        job_title = data.get('job_title')
        phone = data.get('phone', '')
        pin_code = data.get('pin_code')
        
        db = get_db()
        # Verify Admin PIN
        admin_pin_row = db.execute("SELECT value FROM settings WHERE key='admin_pin'").fetchone()
        expected_pin = admin_pin_row['value'] if admin_pin_row else '1234'
        if admin_pin != expected_pin:
            db.close()
            return jsonify({'success': False, 'error': 'PIN الأدمن غير صحيح'}), 401
            
        db.execute("""
            UPDATE employees 
            SET name=?, job_title=?, phone=?, pin_code=? 
            WHERE id=?
        """, (name, job_title, phone, pin_code, emp_id))
        db.commit()
        db.close()
        
        # Sync update to cloud so it's not overwritten by background sync
        cloud_url = cfg.get('cloud_base_url', '').rstrip('/')
        if cloud_url and has_internet():
            try:
                requests.put(
                    f"{cloud_url}/api/hr/employees/{emp_id}",
                    json={'name': name, 'job_title': job_title, 'phone': phone, 'pin_code': pin_code},
                    headers={'Authorization': f"Bearer {cfg.get('sync_api_key', '')}"},
                    timeout=5
                )
            except:
                pass
                
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/employee/unlink', methods=['POST'])
def admin_unlink_employee():
    try:
        data = request.json or {}
        admin_pin = data.get('admin_pin')
        emp_id = data.get('id')
        
        db = get_db()
        admin_pin_row = db.execute("SELECT value FROM settings WHERE key='admin_pin'").fetchone()
        expected_pin = admin_pin_row['value'] if admin_pin_row else '1234'
        if admin_pin != expected_pin:
            db.close()
            return jsonify({'success': False, 'error': 'Unauthorized'}), 401
            
        db.execute("UPDATE employees SET device_id = NULL WHERE id = ?", (emp_id,))
        db.commit()
        db.close()
        
        # Unlink on cloud too
        try_unlink_device_on_cloud(emp_id)
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/employee/history/<int:emp_id>')
def admin_employee_history(emp_id):
    try:
        admin_pin = request.args.get('admin_pin')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        db = get_db()
        admin_pin_row = db.execute("SELECT value FROM settings WHERE key='admin_pin'").fetchone()
        expected_pin = admin_pin_row['value'] if admin_pin_row else '1234'
        if admin_pin != expected_pin:
            db.close()
            return jsonify({'success': False, 'error': 'Unauthorized'}), 401
            
        query = "SELECT * FROM attendance WHERE employee_id=?"
        params = [emp_id]
        
        if start_date:
            query += " AND attendance_date >= ?"
            params.append(start_date)
        if end_date:
            query += " AND attendance_date <= ?"
            params.append(end_date)
            
        query += " ORDER BY attendance_date DESC, id DESC"
        
        history = db.execute(query, params).fetchall()
        
        counts_query = "SELECT id, count_date, shift, branch, created_at FROM offline_counts WHERE employee_id=?"
        counts_params = [emp_id]
        if start_date:
            counts_query += " AND count_date >= ?"
            counts_params.append(start_date)
        if end_date:
            counts_query += " AND count_date <= ?"
            counts_params.append(end_date)
        
        counts_query += " ORDER BY created_at DESC"
        counts = db.execute(counts_query, counts_params).fetchall()
        
        db.close()
        return jsonify({
            'success': True, 
            'attendance': [dict(r) for r in history],
            'inventory_counts': [dict(r) for r in counts]
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/inventory/details/<int:count_id>')
def admin_inventory_details(count_id):
    try:
        admin_pin = request.args.get('admin_pin')
        db = get_db()
        admin_pin_row = db.execute("SELECT value FROM settings WHERE key='admin_pin'").fetchone()
        expected_pin = admin_pin_row['value'] if admin_pin_row else '1234'
        if admin_pin != expected_pin:
            db.close()
            return jsonify({'success': False, 'error': 'Unauthorized'}), 401
            
        record = db.execute("SELECT items_json FROM offline_counts WHERE id=?", (count_id,)).fetchone()
        db.close()
        if record:
            return jsonify({'success': True, 'items': json.loads(record['items_json'])})
        return jsonify({'success': False, 'error': 'Record not found'}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/unlink_employee_device', methods=['POST'])
def unlink_employee_device():
    try:
        # Only called from admin panel, but let's verify pin
        data = request.json or {}
        pin = data.get('pin')
        emp_id = data.get('employee_id')
        db = get_db()
        admin_pin_row = db.execute("SELECT value FROM settings WHERE key='admin_pin'").fetchone()
        expected_pin = admin_pin_row['value'] if admin_pin_row else '1234'
        
        if pin != expected_pin:
            db.close()
            return jsonify({'success': False, 'error': 'كلمة المرور غير صحيحة'}), 401
        
        # Remove device_id from local db
        db.execute("UPDATE employees SET device_id=NULL WHERE id=?", (emp_id,))
        db.commit()
        db.close()
        
        # Unlink on cloud too
        try_unlink_device_on_cloud(emp_id)
        return jsonify({'success': True})
    except Exception as e:
        print(f"Error unlinking device locally: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

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

def do_inventory_sync():
    """Sync offline inventory counts and fetch new products."""
    if not REQUESTS_OK or not has_internet(): return
    cloud_url = cfg.get('cloud_base_url', '').rstrip('/')
    if not cloud_url: return

    db = get_db()
    
    # 1. PUSH unsynced inventory counts
    unsynced_inv = db.execute("SELECT * FROM offline_counts WHERE synced=0").fetchall()
    if unsynced_inv:
        for row in unsynced_inv:
            try:
                items = json.loads(row['items_json'] or '[]')
            except:
                items = []
                
            payload = {
                'employee_id': row['employee_id'],
                'count_date': row['count_date'],
                'shift': row['shift'],
                'branch': row['branch'],
                'items': items,
                'notes': 'Offline Kiosk Sync'
            }
            try:
                resp = requests.post(
                    f"{cloud_url}/api/inventory-counts",
                    json=payload,
                    timeout=15
                )
                if resp.status_code == 200:
                    db.execute("UPDATE offline_counts SET synced=1 WHERE id=?", (row['id'],))
                    db.commit()
            except:
                pass

    # 2. PULL fresh products catalog
    try:
        resp = requests.get(
            f"{cloud_url}/api/products",
            headers={'Authorization': f"Bearer {cfg.get('sync_api_key', '')}"},
            timeout=10
        )
        if resp.status_code == 200:
            products = resp.json()
            # Clear old products and insert fresh ones (fastest way to sync static catalog)
            db.execute("DELETE FROM products")
            for p in products:
                db.execute('''
                    INSERT INTO products (id, name, category, barcode, sku, price, active, unit)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', (p['id'], p['name'], p.get('category'), p.get('barcode'), p.get('sku'), p.get('price', 0), p.get('active', 1) and 1 or 0, p.get('unit')))
            db.commit()
    except Exception as e:
        print("Failed pulling products:", e)
        pass

    db.close()

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
                off_days = json.dumps(emp.get('off_days') or [])
                db.execute("""
                    INSERT INTO employees (id, name, job_title, work_start_time, work_end_time,
                        late_threshold_minutes, off_days, is_active, pin_code, device_id, last_synced_at)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?)
                    ON CONFLICT(id) DO UPDATE SET
                        name=excluded.name, job_title=excluded.job_title,
                        work_start_time=excluded.work_start_time,
                        work_end_time=excluded.work_end_time,
                        late_threshold_minutes=excluded.late_threshold_minutes,
                        off_days=excluded.off_days,
                        is_active=excluded.is_active,
                        pin_code=excluded.pin_code,
                        device_id=excluded.device_id,
                        last_synced_at=excluded.last_synced_at
                """, (emp['id'], emp['name'], emp.get('job_title',''),
                      emp.get('work_start_time','09:00'), emp.get('work_end_time','17:00'),
                      emp.get('late_threshold_minutes', 15), off_days,
                      1 if emp.get('is_active', True) else 0,
                      emp.get('pin_code', '0000'), emp.get('device_id'),
                      datetime.now().isoformat()))
            
            # Now fetch the admin PIN
            resp_pin = requests.get(
                f"{cloud_url}/api/settings/kiosk-pin",
                headers={'Authorization': f"Bearer {cfg.get('sync_api_key', '')}"},
                timeout=5
            )
            if resp_pin.status_code == 200:
                pin_data = resp_pin.json()
                if 'pin' in pin_data:
                    db.execute("INSERT INTO settings (key, value) VALUES ('admin_pin', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", (pin_data['pin'],))

            db.commit()
            db.close()
            return {'success': True, 'message': f'تم تحديث {len(employees)} موظف', 'count': len(employees)}
        return {'success': False, 'message': f'فشل: {resp.status_code}'}
    except Exception as e:
        return {'success': False, 'message': str(e)}

def try_unlink_device_on_cloud(emp_id):
    """Helper to wipe device_id on cloud when unlinked by admin"""
    cloud_url = cfg.get('cloud_base_url', '').rstrip('/')
    if not cloud_url or not has_internet():
        return
    try:
        requests.put(
            f"{cloud_url}/api/hr/employees/{emp_id}",
            json={'device_id': None},
            headers={'Authorization': f"Bearer {cfg.get('sync_api_key', '')}"},
            timeout=5
        )
    except:
        pass

def background_sync_loop():
    """Background thread: sync every 10 seconds, and refresh employees every 3 loops."""
    # Run an immediate refresh exactly once on startup:
    try:
        sync_employees_from_cloud()
        do_sync()
    except:
        pass

    loops = 0
    while True:
        time.sleep(10)  # 10 seconds (faster sync)
        loops += 1
        try:
            do_sync()
            do_inventory_sync()
            # Refresh employees every 3 loops (30 seconds)
            if loops >= 3:
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
    print(f"  نظام تسجيل الحضور")
    print(f"  رابط التطبيق: http://localhost:{port}")
    print(f"  لوحة الإدارة: http://localhost:{port}/admin")
    print(f"{'='*50}\n")
    # Open browser automatically
    threading.Timer(1.5, lambda: webbrowser.open(f'http://localhost:{port}')).start()
    app.run(host='0.0.0.0', port=port, debug=False, use_reloader=False)
