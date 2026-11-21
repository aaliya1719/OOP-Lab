#include <iostream>
#include <vector>
#include <string>
#include <fstream>
#include <sstream>
#include <algorithm>
#include <iomanip>
#include <limits>
#include <cctype>
using namespace std;

// ================= INPUT FUNCTIONS =================

string getString(string message) {
    string value;
    cout << message;
    getline(cin, value);
    return value;
}

int getInt(string message) {
    int value;

    while (true) {
        cout << message;

        if (cin >> value) {
            cin.ignore(numeric_limits<streamsize>::max(), '\n');
            return value;
        }

        cout << "Invalid input. Enter a number: ";
        cin.clear();
        cin.ignore(numeric_limits<streamsize>::max(), '\n');
    }
}

bool validPhone(string phone) {
    return phone.length() >= 7 &&
           phone.length() <= 15 &&
           all_of(phone.begin(), phone.end(),
                  [](unsigned char c) { return isdigit(c); });
}

bool validDate(string date) {
    if (date.length() != 10 || date[4] != '-' || date[7] != '-')
        return false;

    stringstream ss(date);
    int year, month, day;
    char dash1, dash2;

    ss >> year >> dash1 >> month >> dash2 >> day;

    if (ss.fail() || !ss.eof() || year < 2000 ||
        month < 1 || month > 12)
        return false;

    int days[] = {31,28,31,30,31,30,31,31,30,31,30,31};

    bool leap = (year % 400 == 0) ||
                (year % 4 == 0 && year % 100 != 0);

    if (leap)
        days[1] = 29;

    return day >= 1 && day <= days[month - 1];
}

bool validTime(string time) {
    if (time.length() != 5 || time[2] != ':')
        return false;

    if (!isdigit(time[0]) || !isdigit(time[1]) ||
        !isdigit(time[3]) || !isdigit(time[4]))
        return false;

    int hour = stoi(time.substr(0, 2));
    int minute = stoi(time.substr(3, 2));

    return hour >= 0 && hour <= 23 &&
           minute >= 0 && minute <= 59;
}

vector<string> split(string line) {
    vector<string> fields;
    string field;
    stringstream ss(line);

    while (getline(ss, field, '|'))
        fields.push_back(field);

    return fields;
}

// ================= BASE CLASS =================

class Person {
protected:
    string name;
    int age;
    string phone;

public:
    Person() {
        age = 0;
    }

    Person(string n, int a, string p) {
        name = n;
        age = a;
        phone = p;
    }

    int getAge() const {
        return age;
    }

    string getPhone() const {
        return phone;
    }

    virtual void displayDetails() const {
        cout << "Name: " << name
             << "\nAge: " << age
             << "\nPhone: " << phone << '\n';
    }

    virtual ~Person() {}
};

// ================= PATIENT CLASS =================

class Patient : public Person {
private:
    string patientID;
    string address;

public:
    Patient() {}

    Patient(string id, string n, int a,
            string p, string addr)
        : Person(n, a, p) {
        patientID = id;
        address = addr;
    }

    string getID() const {
        return patientID;
    }

    string getName() const {
        return name;
    }

    string getAddress() const {
        return address;
    }

    void setName(string n) {
        name = n;
    }

    void setAge(int a) {
        age = a;
    }

    void setPhone(string p) {
        phone = p;
    }

    void setAddress(string a) {
        address = a;
    }

    void displayDetails() const override {
        cout << "\nPatient ID: " << patientID << '\n';
        Person::displayDetails();
        cout << "Address: " << address << '\n';
    }
};

// ================= DOCTOR CLASS =================

class Doctor : public Person {
private:
    string doctorID;
    string specialization;

public:
    Doctor() {}

    Doctor(string id, string n, int a,
           string p, string s)
        : Person(n, a, p) {
        doctorID = id;
        specialization = s;
    }

    string getID() const {
        return doctorID;
    }

    string getName() const {
        return name;
    }

    string getSpecialization() const {
        return specialization;
    }

    void displayDetails() const override {
        cout << "\nDoctor ID: " << doctorID << '\n';
        Person::displayDetails();
        cout << "Specialization: " << specialization << '\n';
    }
};

// ================= APPOINTMENT CLASS =================

class Appointment {
private:
    string appointmentID;
    string patientID;
    string doctorID;
    string date;
    string time;
    string status;

public:
    Appointment() {}

    Appointment(string aid, string pid, string did,
                string d, string t, string s = "Booked") {
        appointmentID = aid;
        patientID = pid;
        doctorID = did;
        date = d;
        time = t;
        status = s;
    }

    string getID() const {
        return appointmentID;
    }

    string getPatientID() const {
        return patientID;
    }

    string getDoctorID() const {
        return doctorID;
    }

    string getDate() const {
        return date;
    }

    string getTime() const {
        return time;
    }

    string getStatus() const {
        return status;
    }

    void cancel() {
        status = "Cancelled";
    }

    void displayDetails() const {
        cout << "\nAppointment ID: " << appointmentID
             << "\nPatient ID: " << patientID
             << "\nDoctor ID: " << doctorID
             << "\nDate: " << date
             << "\nTime: " << time
             << "\nStatus: " << status << '\n';
    }
};

// ================= HOSPITAL CLASS =================

class Hospital {
private:
    vector<Patient> patients;
    vector<Doctor> doctors;
    vector<Appointment> appointments;

    string generateID(char prefix, int number) {
        stringstream ss;
        ss << prefix << setw(3) << setfill('0') << number;
        return ss.str();
    }

    vector<Patient>::iterator findPatient(string id) {
        return find_if(patients.begin(), patients.end(),
            [id](const Patient& p) {
                return p.getID() == id;
            });
    }

    vector<Doctor>::iterator findDoctor(string id) {
        return find_if(doctors.begin(), doctors.end(),
            [id](const Doctor& d) {
                return d.getID() == id;
            });
    }

    vector<Appointment>::iterator findAppointment(string id) {
        return find_if(appointments.begin(), appointments.end(),
            [id](const Appointment& a) {
                return a.getID() == id;
            });
    }

    // ================= FILE HANDLING =================

public:
    void loadData() {
        string line;

        ifstream pf("patients.txt");

        while (getline(pf, line)) {
            vector<string> f = split(line);

            if (f.size() == 5) {
                try {
                    patients.emplace_back(
                        f[0], f[1], stoi(f[2]), f[3], f[4]
                    );
                }
                catch (...) {
                    cout << "Skipped an invalid patient record.\n";
                }
            }
        }

        ifstream df("doctors.txt");

        while (getline(df, line)) {
            vector<string> f = split(line);

            if (f.size() == 5) {
                try {
                    doctors.emplace_back(
                        f[0], f[1], stoi(f[2]), f[3], f[4]
                    );
                }
                catch (...) {
                    cout << "Skipped an invalid doctor record.\n";
                }
            }
        }

        ifstream af("appointments.txt");

        while (getline(af, line)) {
            vector<string> f = split(line);

            if (f.size() == 6) {
                appointments.emplace_back(
                    f[0], f[1], f[2], f[3], f[4], f[5]
                );
            }
        }

        cout << "\nRecords loaded successfully.\n";
    }

    void saveData() {
        ofstream pf("patients.txt");

        for (const Patient& p : patients) {
            pf << p.getID() << '|'
               << p.getName() << '|'
               << p.getAge() << '|'
               << p.getPhone() << '|'
               << p.getAddress() << '\n';
        }

        ofstream df("doctors.txt");

        for (const Doctor& d : doctors) {
            df << d.getID() << '|'
               << d.getName() << '|'
               << d.getAge() << '|'
               << d.getPhone() << '|'
               << d.getSpecialization() << '\n';
        }

        ofstream af("appointments.txt");

        for (const Appointment& a : appointments) {
            af << a.getID() << '|'
               << a.getPatientID() << '|'
               << a.getDoctorID() << '|'
               << a.getDate() << '|'
               << a.getTime() << '|'
               << a.getStatus() << '\n';
        }

        cout << "\nRecords saved successfully.\n";
    }

    // ================= PATIENT MANAGEMENT =================

    void addPatient() {
        cout << "\n--- Register Patient ---\n";

        string n = getString("Enter name: ");
        int a = getInt("Enter age: ");
        string p = getString("Enter phone: ");
        string addr = getString("Enter address: ");

        if (n.empty() || a <= 0 || a > 120 ||
            !validPhone(p) || addr.empty() ||
            n.find('|') != string::npos ||
            addr.find('|') != string::npos) {
            cout << "Invalid patient details.\n";
            return;
        }

        // Find an unused ID, including after records have been deleted.
        int number = 1;
        string id;

        do {
            id = generateID('P', number++);
        } while (findPatient(id) != patients.end());

        patients.emplace_back(id, n, a, p, addr);

        cout << "Patient registered! ID: " << id << '\n';
    }

    void displayPatients() {
        if (patients.empty()) {
            cout << "No patient records found.\n";
            return;
        }

        for (const Patient& p : patients)
            p.displayDetails();
    }

    void searchPatient() {
        string id = getString("Enter Patient ID: ");
        auto it = findPatient(id);

        if (it != patients.end())
            it->displayDetails();
        else
            cout << "Patient not found.\n";
    }

    void updatePatient() {
        string id = getString("Enter Patient ID: ");
        auto it = findPatient(id);

        if (it == patients.end()) {
            cout << "Patient not found.\n";
            return;
        }

        cout << "\n1. Update Name\n"
             << "2. Update Age\n"
             << "3. Update Phone\n"
             << "4. Update Address\n";

        int ch = getInt("Enter choice: ");

        switch (ch) {
            case 1: {
                string value = getString("New name: ");
                if (!value.empty() && value.find('|') == string::npos)
                    it->setName(value);
                else {
                    cout << "Invalid name.\n";
                    return;
                }
                break;
            }

            case 2: {
                int value = getInt("New age: ");
                if (value > 0 && value <= 120)
                    it->setAge(value);
                else {
                    cout << "Invalid age.\n";
                    return;
                }
                break;
            }

            case 3: {
                string value = getString("New phone: ");
                if (validPhone(value))
                    it->setPhone(value);
                else {
                    cout << "Invalid phone number.\n";
                    return;
                }
                break;
            }

            case 4: {
                string value = getString("New address: ");
                if (!value.empty() && value.find('|') == string::npos)
                    it->setAddress(value);
                else {
                    cout << "Invalid address.\n";
                    return;
                }
                break;
            }

            default:
                cout << "Invalid choice.\n";
                return;
        }

        cout << "Patient updated successfully.\n";
    }

    void deletePatient() {
        string id = getString("Enter Patient ID: ");
        auto it = findPatient(id);

        if (it == patients.end()) {
            cout << "Patient not found.\n";
            return;
        }

        bool hasAppointment = any_of(
            appointments.begin(), appointments.end(),
            [id](const Appointment& a) {
                return a.getPatientID() == id &&
                       a.getStatus() == "Booked";
            }
        );

        if (hasAppointment) {
            cout << "Cancel active appointments before removing this patient.\n";
            return;
        }

        patients.erase(it);
        cout << "Patient removed successfully.\n";
    }

    // ================= DOCTOR MANAGEMENT =================

    void addDoctor() {
        cout << "\n--- Add Doctor ---\n";

        string n = getString("Enter name: ");
        int a = getInt("Enter age: ");
        string p = getString("Enter phone: ");
        string s = getString("Enter specialization: ");

        if (n.empty() || a <= 0 || a > 120 ||
            !validPhone(p) || s.empty() ||
            n.find('|') != string::npos ||
            s.find('|') != string::npos) {
            cout << "Invalid doctor details.\n";
            return;
        }

        int number = 1;
        string id;

        do {
            id = generateID('D', number++);
        } while (findDoctor(id) != doctors.end());

        doctors.emplace_back(id, n, a, p, s);

        cout << "Doctor added! ID: " << id << '\n';
    }

    void displayDoctors() {
        if (doctors.empty()) {
            cout << "No doctor records found.\n";
            return;
        }

        for (const Doctor& d : doctors)
            d.displayDetails();
    }

    void searchDoctor() {
        string id = getString("Enter Doctor ID: ");
        auto it = findDoctor(id);

        if (it != doctors.end())
            it->displayDetails();
        else
            cout << "Doctor not found.\n";
    }

    // ================= APPOINTMENT MANAGEMENT =================

    void bookAppointment() {
        if (patients.empty() || doctors.empty()) {
            cout << "Add at least one patient and doctor first.\n";
            return;
        }

        string pid = getString("Enter Patient ID: ");

        if (findPatient(pid) == patients.end()) {
            cout << "Patient does not exist.\n";
            return;
        }

        string did = getString("Enter Doctor ID: ");

        if (findDoctor(did) == doctors.end()) {
            cout << "Doctor does not exist.\n";
            return;
        }

        string date = getString("Enter date (YYYY-MM-DD): ");

        if (!validDate(date)) {
            cout << "Invalid date format or date.\n";
            return;
        }

        string time = getString("Enter time (HH:MM, 24-hour): ");

        if (!validTime(time)) {
            cout << "Invalid time. Example: 14:30\n";
            return;
        }

        // Prevent two active appointments for the same doctor and slot.
        bool duplicate = any_of(
            appointments.begin(), appointments.end(),
            [did, date, time](const Appointment& a) {
                return a.getDoctorID() == did &&
                       a.getDate() == date &&
                       a.getTime() == time &&
                       a.getStatus() == "Booked";
            }
        );

        if (duplicate) {
            cout << "Doctor is already booked for this time slot.\n";
            return;
        }

        int number = 1;
        string id;

        do {
            id = generateID('A', number++);
        } while (findAppointment(id) != appointments.end());

        appointments.emplace_back(id, pid, did, date, time);

        cout << "Appointment booked! ID: " << id << '\n';
    }

    void displayAppointments() {
        if (appointments.empty()) {
            cout << "No appointments found.\n";
            return;
        }

        for (const Appointment& a : appointments)
            a.displayDetails();
    }

    void patientAppointments() {
        string pid = getString("Enter Patient ID: ");
        bool found = false;

        for (const Appointment& a : appointments) {
            if (a.getPatientID() == pid) {
                a.displayDetails();
                found = true;
            }
        }

        if (!found)
            cout << "No appointments found for this patient.\n";
    }

    void cancelAppointment() {
        string id = getString("Enter Appointment ID: ");
        auto it = findAppointment(id);

        if (it == appointments.end()) {
            cout << "Appointment not found.\n";
            return;
        }

        if (it->getStatus() == "Cancelled") {
            cout << "Appointment is already cancelled.\n";
            return;
        }

        it->cancel();
        cout << "Appointment cancelled successfully.\n";
    }

    // ================= HOSPITAL OVERVIEW =================

    void overview() {
        int active = count_if(
            appointments.begin(), appointments.end(),
            [](const Appointment& a) {
                return a.getStatus() == "Booked";
            }
        );

        cout << "\n========== HOSPITAL OVERVIEW ==========\n";
        cout << "Total Patients: " << patients.size() << '\n';
        cout << "Total Doctors: " << doctors.size() << '\n';
        cout << "Total Appointments: " << appointments.size() << '\n';
        cout << "Active Appointments: " << active << '\n';
        cout << "Cancelled Appointments: "
             << appointments.size() - active << '\n';
        cout << "=======================================\n";
    }

    // ================= SUBMENUS =================

    void patientMenu() {
        int ch;

        do {
            cout << "\n------ PATIENT MANAGEMENT ------\n"
                 << "1. Register Patient\n"
                 << "2. Display All Patients\n"
                 << "3. Search Patient\n"
                 << "4. Update Patient\n"
                 << "5. Remove Patient\n"
                 << "6. Back\n";

            ch = getInt("Enter choice: ");

            switch (ch) {
                case 1: addPatient(); break;
                case 2: displayPatients(); break;
                case 3: searchPatient(); break;
                case 4: updatePatient(); break;
                case 5: deletePatient(); break;
                case 6: break;
                default: cout << "Invalid choice.\n";
            }
        } while (ch != 6);
    }

    void doctorMenu() {
        int ch;

        do {
            cout << "\n------ DOCTOR MANAGEMENT ------\n"
                 << "1. Add Doctor\n"
                 << "2. Display All Doctors\n"
                 << "3. Search Doctor\n"
                 << "4. Back\n";

            ch = getInt("Enter choice: ");

            switch (ch) {
                case 1: addDoctor(); break;
                case 2: displayDoctors(); break;
                case 3: searchDoctor(); break;
                case 4: break;
                default: cout << "Invalid choice.\n";
            }
        } while (ch != 4);
    }

    void appointmentMenu() {
        int ch;

        do {
            cout << "\n------ APPOINTMENT MANAGEMENT ------\n"
                 << "1. Book Appointment\n"
                 << "2. View All Appointments\n"
                 << "3. View Patient Appointments\n"
                 << "4. Cancel Appointment\n"
                 << "5. Back\n";

            ch = getInt("Enter choice: ");

            switch (ch) {
                case 1: bookAppointment(); break;
                case 2: displayAppointments(); break;
                case 3: patientAppointments(); break;
                case 4: cancelAppointment(); break;
                case 5: break;
                default: cout << "Invalid choice.\n";
            }
        } while (ch != 5);
    }

    // ================= MAIN MENU =================

    void run() {
        loadData();

        int ch;

        do {
            cout << "\n========================================\n"
                 << "          PATIENT CARE MANAGER\n"
                 << "       HOSPITAL MANAGEMENT SYSTEM\n"
                 << "========================================\n"
                 << "1. Patient Management\n"
                 << "2. Doctor Management\n"
                 << "3. Appointment Management\n"
                 << "4. Hospital Overview\n"
                 << "5. Save and Exit\n"
                 << "========================================\n";

            ch = getInt("Enter choice: ");

            switch (ch) {
                case 1: patientMenu(); break;
                case 2: doctorMenu(); break;
                case 3: appointmentMenu(); break;
                case 4: overview(); break;
                case 5:
                    saveData();
                    cout << "Thank you for using Patient Care Manager!\n";
                    break;
                default:
                    cout << "Invalid choice.\n";
            }
        } while (ch != 5);
    }
};

// ================= MAIN FUNCTION =================

int main() {
    Hospital hospital;
    hospital.run();

    return 0;
}