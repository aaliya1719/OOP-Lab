# MEDICORE — Hospital Management System
**Topic:** Build a system to manage patient records, doctor details, and appointments.

---

## 📌 Overview
**MEDICORE** is a comprehensive Hospital Management System developed in C++ using Object-Oriented Programming (OOP) principles, featuring **Dual-Mode Execution**:
1. **Interactive Console Mode (CLI)**: A standalone terminal application driven by standard text menus, keyboard input, and C++ stream I/O.
2. **Modern Web UI Mode**: A responsive, pastel-lavender single-page web dashboard powered by HTML5, CSS3, and JavaScript, backed by a lightweight Python bridge (`server.py`) that synchronizes directly with the C++ data storage.

Both modes read from and write to the exact same persistent storage text files (`patients.txt`, `doctors.txt`, and `appointments.txt`) in real time.

---

## 🏗️ Object-Oriented Programming (OOP) Architecture
The core backend is implemented in `main.cpp` adhering to standard C++ OOP fundamentals:
- **Inheritance**: Base class `Person` extended by derived classes `Patient` and `Doctor`.
- **Polymorphism & Dynamic Binding**: Virtual function `displayDetails()` in base class `Person`, overridden in `Patient` and `Doctor`.
- **Encapsulation**: Private data members accessed and modified via public getters and setters.
- **STL Vectors & Algorithms**: Dynamic memory management using `std::vector`, with algorithms like `std::find_if`, `std::any_of`, and `std::count_if`.
- **File Persistence**: Persistent storage with file streams (`std::ifstream` and `std::ofstream`) using delimiter-separated records.

---

## 📂 Project Structure
```text
miniproject_ui/
│
├── main.cpp              # Core C++ OOP hospital management engine
├── main.exe              # Compiled native binary
├── server.py             # Python HTTP server bridge (Port 8080)
│
├── index.html            # Web UI dashboard & modal layouts
├── styles.css            # Lavender-themed CSS styling
├── app.js                # Frontend client logic & API bindings
│
├── patients.txt          # Persistent flat-file storage for Patients
├── doctors.txt           # Persistent flat-file storage for Doctors
├── appointments.txt      # Persistent flat-file storage for Appointments
└── README.md             # Project documentation
```

---

## 🚀 How to Run the Project

### Option 1: Standalone Console Mode (CLI)
Compile and run the C++ program directly in your terminal:

```powershell
# 1. Compile main.cpp using any standard C++17 compiler (MinGW / GCC)
g++ -o main.exe main.cpp -std=c++17

# 2. Run the executable
.\main.exe
```

**Console Main Menu:**
```text
========================================
          PATIENT CARE MANAGER
       HOSPITAL MANAGEMENT SYSTEM
========================================
1. Patient Management
2. Doctor Management
3. Appointment Management
4. Hospital Overview
5. Save and Exit
========================================
```

---

### Option 2: Web UI Mode
Launch the local web server to interact with the system via your browser:

```powershell
# 1. Start the server
python server.py

# 2. Open in your browser:
http://127.0.0.1:8080
```

**Web UI Capabilities:**
- **Dashboard**: Live statistics cards, welcome banner with ECG animation, quick-action tiles, and recent activity timeline.
- **Patient Management**: Patient table with real-time search, View, Edit, and Delete actions, plus a two-column registration modal.
- **Doctor Management**: Doctor staff directory with specialization tags and Add Doctor modal.
- **Appointments**: Appointment scheduler with patient/doctor dropdowns, date & time pickers, active duplicate booking detection, and cancellation actions.
- **Overview & Reports**: Live metrics breakdown showing total patients, doctors, active bookings, and cancellations.

---

## 🔒 Business Logic & Data Integrity
- **Unique ID Generation**: Automatic generation of IDs (`P001`, `D001`, `A001`) by finding the first available incremental identifier.
- **Appointment Conflict Prevention**: The system prevents double-booking a doctor for the exact same date and time slot if an active (`Booked`) appointment exists.
- **Referential Integrity**: A patient cannot be deleted if they currently hold an active (`Booked`) appointment.
- **Validation**:
  - Phone numbers: Digits only, 7 to 15 characters.
  - Dates: `YYYY-MM-DD` format with leap year validation.
  - Times: `HH:MM` 24-hour format (00:00 to 23:59).
  - Age: Integers between 1 and 120.

---

## 👥 Authors & Academic Context
Developed as an Object-Oriented Programming (OOP) Laboratory Project under the syllabus topic:
*"Build a system to manage patient records, doctor details, and appointments."*
