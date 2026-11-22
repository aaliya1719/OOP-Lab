import json
import mimetypes
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent
PATIENTS_FILE = ROOT / "patients.txt"
DOCTORS_FILE = ROOT / "doctors.txt"
APPOINTMENTS_FILE = ROOT / "appointments.txt"
EXE = ROOT / "main.exe"

# ==================== DATA HELPERS ====================

def read_lines(filepath):
    if not filepath.exists():
        return []
    with open(filepath, "r", encoding="utf-8") as f:
        return [line.strip() for line in f if line.strip()]

def write_lines(filepath, lines):
    with open(filepath, "w", encoding="utf-8") as f:
        for line in lines:
            f.write(line + "\n")

def load_patients():
    patients = []
    for line in read_lines(PATIENTS_FILE):
        parts = line.split("|")
        if len(parts) == 5:
            try:
                patients.append({
                    "id": parts[0],
                    "name": parts[1],
                    "age": int(parts[2]),
                    "phone": parts[3],
                    "address": parts[4]
                })
            except ValueError:
                continue
    return patients

def save_patients(patients):
    lines = [f"{p['id']}|{p['name']}|{p['age']}|{p['phone']}|{p['address']}" for p in patients]
    write_lines(PATIENTS_FILE, lines)

def load_doctors():
    doctors = []
    for line in read_lines(DOCTORS_FILE):
        parts = line.split("|")
        if len(parts) == 5:
            try:
                doctors.append({
                    "id": parts[0],
                    "name": parts[1],
                    "age": int(parts[2]),
                    "phone": parts[3],
                    "specialization": parts[4]
                })
            except ValueError:
                continue
    return doctors

def save_doctors(doctors):
    lines = [f"{d['id']}|{d['name']}|{d['age']}|{d['phone']}|{d['specialization']}" for d in doctors]
    write_lines(DOCTORS_FILE, lines)

def load_appointments():
    appointments = []
    patients_map = {p["id"]: p["name"] for p in load_patients()}
    doctors_map = {d["id"]: d["name"] for d in load_doctors()}

    for line in read_lines(APPOINTMENTS_FILE):
        parts = line.split("|")
        if len(parts) == 6:
            pid = parts[1]
            did = parts[2]
            appointments.append({
                "id": parts[0],
                "patientId": pid,
                "patientName": patients_map.get(pid, "Unknown"),
                "doctorId": did,
                "doctorName": doctors_map.get(did, "Unknown"),
                "date": parts[3],
                "time": parts[4],
                "status": parts[5]
            })
    return appointments

def save_appointments(appointments):
    lines = [f"{a['id']}|{a['patientId']}|{a['doctorId']}|{a['date']}|{a['time']}|{a['status']}" for a in appointments]
    write_lines(APPOINTMENTS_FILE, lines)

def next_id(prefix, existing_ids):
    n = 1
    while f"{prefix}{n:03d}" in existing_ids:
        n += 1
    return f"{prefix}{n:03d}"

def is_valid_phone(phone):
    return 7 <= len(phone) <= 15 and phone.isdigit()

def is_valid_date(d_str):
    if len(d_str) != 10 or d_str[4] != '-' or d_str[7] != '-':
        return False
    try:
        y, m, d = int(d_str[:4]), int(d_str[5:7]), int(d_str[8:10])
        if y < 2000 or m < 1 or m > 12:
            return False
        days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
        leap = (y % 400 == 0) or (y % 4 == 0 and y % 100 != 0)
        if leap:
            days[1] = 29
        return 1 <= d <= days[m - 1]
    except Exception:
        return False

def is_valid_time(t_str):
    if len(t_str) != 5 or t_str[2] != ':':
        return False
    try:
        h, m = int(t_str[:2]), int(t_str[3:])
        return 0 <= h <= 23 and 0 <= m <= 59
    except Exception:
        return False

# ==================== HTTP HANDLER ====================

class Handler(BaseHTTPRequestHandler):
    server_version = "MEDICORE/1.0"

    def send_json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_HEAD(self):
        path = self.path.split("?", 1)[0]
        if path == "/":
            path = "/index.html"
        file_path = (ROOT / path.lstrip("/")).resolve()
        if ROOT not in file_path.parents or not file_path.is_file():
            self.send_error(404)
            return
        content_type = mimetypes.guess_type(file_path.name)[0] or "application/octet-stream"
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(file_path.stat().st_size))
        self.end_headers()

    def do_GET(self):
        path = self.path.split("?", 1)[0]
        if path == "/api/snapshot":
            patients = load_patients()
            doctors = load_doctors()
            appointments = load_appointments()
            active = sum(1 for a in appointments if a["status"] == "Booked")
            payload = {
                "patients": patients,
                "doctors": doctors,
                "appointments": appointments,
                "summary": {
                    "patients": len(patients),
                    "doctors": len(doctors),
                    "appointments": len(appointments),
                    "active": active,
                    "cancelled": len(appointments) - active
                }
            }
            self.send_json(200, payload)
            return

        if path == "/":
            path = "/index.html"

        file_path = (ROOT / path.lstrip("/")).resolve()
        if ROOT not in file_path.parents:
            self.send_error(403)
            return
        if not file_path.is_file():
            self.send_error(404)
            return

        content = file_path.read_bytes()
        content_type = mimetypes.guess_type(file_path.name)[0] or "application/octet-stream"
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def read_json(self):
        length = int(self.headers.get("Content-Length", "0"))
        if not length:
            return {}
        try:
            return json.loads(self.rfile.read(length).decode("utf-8"))
        except json.JSONDecodeError:
            return None

    def do_POST(self):
        data = self.read_json()
        if data is None:
            self.send_json(400, {"ok": False, "error": "Invalid JSON request."})
            return

        path = self.path
        if path == "/api/patients":
            name = str(data.get("name", "")).strip()
            try:
                age = int(data.get("age", 0))
            except (ValueError, TypeError):
                self.send_json(400, {"ok": False, "error": "Enter a valid age."})
                return
            phone = str(data.get("phone", "")).strip()
            address = str(data.get("address", "")).strip()

            if not name or age <= 0 or age > 120 or not is_valid_phone(phone) or not address or "|" in name or "|" in address:
                self.send_json(400, {"ok": False, "error": "Enter a valid name, age, phone number and address."})
                return

            patients = load_patients()
            new_id = next_id("P", {p["id"] for p in patients})
            patients.append({"id": new_id, "name": name, "age": age, "phone": phone, "address": address})
            save_patients(patients)
            self.send_json(200, {"ok": True, "id": new_id, "error": ""})

        elif path == "/api/doctors":
            name = str(data.get("name", "")).strip()
            try:
                age = int(data.get("age", 0))
            except (ValueError, TypeError):
                self.send_json(400, {"ok": False, "error": "Enter a valid age."})
                return
            phone = str(data.get("phone", "")).strip()
            spec = str(data.get("specialization", "")).strip()

            if not name or age <= 0 or age > 120 or not is_valid_phone(phone) or not spec or "|" in name or "|" in spec:
                self.send_json(400, {"ok": False, "error": "Enter a valid name, age, phone number and specialization."})
                return

            doctors = load_doctors()
            new_id = next_id("D", {d["id"] for d in doctors})
            doctors.append({"id": new_id, "name": name, "age": age, "phone": phone, "specialization": spec})
            save_doctors(doctors)
            self.send_json(200, {"ok": True, "id": new_id, "error": ""})

        elif path == "/api/appointments":
            pid = str(data.get("patientId", "")).strip()
            did = str(data.get("doctorId", "")).strip()
            date = str(data.get("date", "")).strip()
            time = str(data.get("time", "")).strip()

            patients = load_patients()
            doctors = load_doctors()
            appointments = load_appointments()

            if not patients or not doctors:
                self.send_json(400, {"ok": False, "error": "Add at least one patient and doctor first."})
                return
            if not any(p["id"] == pid for p in patients):
                self.send_json(400, {"ok": False, "error": "Patient does not exist."})
                return
            if not any(d["id"] == did for d in doctors):
                self.send_json(400, {"ok": False, "error": "Doctor does not exist."})
                return
            if not is_valid_date(date):
                self.send_json(400, {"ok": False, "error": "Invalid date. Use YYYY-MM-DD."})
                return
            if not is_valid_time(time):
                self.send_json(400, {"ok": False, "error": "Invalid time. Use HH:MM in 24-hour format."})
                return

            if any(a["doctorId"] == did and a["date"] == date and a["time"] == time and a["status"] == "Booked" for a in appointments):
                self.send_json(400, {"ok": False, "error": "Doctor is already booked for this time slot."})
                return

            new_id = next_id("A", {a["id"] for a in appointments})
            appointments.append({
                "id": new_id,
                "patientId": pid,
                "doctorId": did,
                "date": date,
                "time": time,
                "status": "Booked"
            })
            save_appointments(appointments)
            self.send_json(200, {"ok": True, "id": new_id, "error": ""})

        else:
            self.send_json(404, {"ok": False, "error": "Endpoint not found."})

    def do_PUT(self):
        data = self.read_json()
        if data is None or not self.path.startswith("/api/patients/"):
            self.send_json(400, {"ok": False, "error": "Invalid request."})
            return

        patient_id = self.path.rsplit("/", 1)[1]
        name = str(data.get("name", "")).strip()
        try:
            age = int(data.get("age", 0))
        except (ValueError, TypeError):
            self.send_json(400, {"ok": False, "error": "Enter a valid age."})
            return
        phone = str(data.get("phone", "")).strip()
        address = str(data.get("address", "")).strip()

        if not name or age <= 0 or age > 120 or not is_valid_phone(phone) or not address or "|" in name or "|" in address:
            self.send_json(400, {"ok": False, "error": "Enter a valid name, age, phone number and address."})
            return

        patients = load_patients()
        p = next((x for x in patients if x["id"] == patient_id), None)
        if not p:
            self.send_json(404, {"ok": False, "error": "Patient not found."})
            return

        p["name"] = name
        p["age"] = age
        p["phone"] = phone
        p["address"] = address
        save_patients(patients)
        self.send_json(200, {"ok": True, "error": ""})

    def do_DELETE(self):
        if not self.path.startswith("/api/patients/"):
            self.send_json(404, {"ok": False, "error": "Endpoint not found."})
            return

        patient_id = self.path.rsplit("/", 1)[1]
        patients = load_patients()
        p = next((x for x in patients if x["id"] == patient_id), None)
        if not p:
            self.send_json(404, {"ok": False, "error": "Patient not found."})
            return

        appointments = load_appointments()
        if any(a["patientId"] == patient_id and a["status"] == "Booked" for a in appointments):
            self.send_json(400, {"ok": False, "error": "Cancel active appointments before removing this patient."})
            return

        patients = [x for x in patients if x["id"] != patient_id]
        save_patients(patients)
        self.send_json(200, {"ok": True, "error": ""})

    def do_PATCH(self):
        if not self.path.startswith("/api/appointments/"):
            self.send_json(404, {"ok": False, "error": "Endpoint not found."})
            return

        appointment_id = self.path.rsplit("/", 1)[1]
        appointments = load_appointments()
        a = next((x for x in appointments if x["id"] == appointment_id), None)
        if not a:
            self.send_json(404, {"ok": False, "error": "Appointment not found."})
            return
        if a["status"] == "Cancelled":
            self.send_json(400, {"ok": False, "error": "Appointment is already cancelled."})
            return

        a["status"] = "Cancelled"
        save_appointments(appointments)
        self.send_json(200, {"ok": True, "error": ""})

    def log_message(self, format, *args):
        return

if __name__ == "__main__":
    server = ThreadingHTTPServer(("127.0.0.1", 8080), Handler)
    print("MEDICORE Hospital Management System running at http://127.0.0.1:8080")
    server.serve_forever()
