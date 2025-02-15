import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmployeeModel } from './models/employee';
import { HybridWebCache, StorageType } from 'hybrid-webcache';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ReactiveFormsModule], // Importing necessary modules for form handling
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'CRUD_Angular18'; // Title of the app

  cache: HybridWebCache;
  employeeForm: FormGroup = new FormGroup({}); // FormGroup to manage the employee form controls
  employeeObj: EmployeeModel = new EmployeeModel(); // Object to hold the employee data
  employeeList: EmployeeModel[] = []; // Array to store the list of employees

  constructor() {
    this.createForm(); // Initialize the form when the component is created
    this.cache = new HybridWebCache("HybridWebCache", { storage: StorageType.IndexedDB, ttl: { hours: 1 }, removeExpired: true });
    this.employeeList = this.employees;

    console.log(this.cache.info);
    //const data = localStorage.getItem("EmpData"); // Fetching old data from localStorage
    // if (data != null) {
    //   const parseData = JSON.parse(data);
    //   this.employeeList = parseData; // Populating the employee list with stored data
    // }
  }

  get employees() {
    return this.cache.getSync<EmployeeModel[]>("employees")?.value ?? Array<EmployeeModel>();
  }

  // Method to reset the form and the employee object
  reset() {
    this.employeeObj = new EmployeeModel();
    this.createForm();

    console.log(this.cache.info);
  }

  // Method to create and initialize the form with default values
  createForm() {
    this.employeeForm = new FormGroup({
      empId: new FormControl(this.employeeObj.empId),
      name: new FormControl(this.employeeObj.name, [Validators.required]),
      city: new FormControl(this.employeeObj.city),
      state: new FormControl(this.employeeObj.state),
      emailId: new FormControl(this.employeeObj.emailId),
      contactNo: new FormControl(this.employeeObj.contactNo),
      address: new FormControl(this.employeeObj.address),
      pinCode: new FormControl(this.employeeObj.pinCode, [Validators.required, Validators.minLength(6)]),
    });
  }

  // Method to save
  onSave() {
    const data = this.employees;
    const empId = data.length + 1;

    this.employeeForm.controls['empId'].setValue(empId);
    this.cache.setSync(`employees[${empId - 1}]`, this.employeeForm.value);

    if (empId === 1) {
      data.push(this.employeeForm.value);
    }
    console.log(data);
    this.employeeList = data;

    // this.employeeList.unshift(this.employeeForm.value);


    // const oldData = localStorage.getItem("EmpData");
    // if (oldData != null) {
    //   const parseData = JSON.parse(oldData);
    //   this.employeeForm.controls['empId'].setValue(parseData.length + 1); // Assigning a new ID
    //   this.employeeList.unshift(this.employeeForm.value); // Adding the new employee to the top of the list
    // } else {
    //   this.employeeForm.controls['empId'].setValue(1); // Start with ID 1 if no data exists
    //   this.employeeList.unshift(this.employeeForm.value);
    // }
    // localStorage.setItem("EmpData", JSON.stringify(this.employeeList)); // Save the updated list to localStorage
    // this.reset(); // Reset the form after saving

    console.log(this.cache.getAllSync())
  }

  // Method to edit
  onEdit(item: EmployeeModel) {
    this.employeeObj = item; // Set the selected employee data in the form
    this.createForm(); // Recreate the form with the selected employee's data
  }

  // Method to update
  onUpdate() {
    const employeeId = this.employeeForm.controls['empId'].value;
    const employees = this.employees;
    const index = employees.findIndex(e => e.empId === employeeId);

    if (index > -1) {
      const employee = employees[index];

      employee.name = this.employeeForm.controls['name'].value;
      employee.city = this.employeeForm.controls['city'].value;
      employee.state = this.employeeForm.controls['state'].value;
      employee.emailId = this.employeeForm.controls['emailId'].value;
      employee.contactNo = this.employeeForm.controls['contactNo'].value;
      employee.address = this.employeeForm.controls['address'].value;
      employee.pinCode = this.employeeForm.controls['pinCode'].value;

      this.cache.setSync(`employees[${index}]`, employee);
    }
    this.employeeList = employees;

    // const record = this.employeeList.find(m => m.empId == this.employeeForm.controls['empId'].value);
    // if (record != undefined) {
    //   // Update the record with the form values
    //   record.name = this.employeeForm.controls['name'].value;
    //   record.city = this.employeeForm.controls['city'].value;
    //   record.state = this.employeeForm.controls['state'].value;
    //   record.emailId = this.employeeForm.controls['emailId'].value;
    //   record.contactNo = this.employeeForm.controls['contactNo'].value;
    //   record.address = this.employeeForm.controls['address'].value;
    //   record.pinCode = this.employeeForm.controls['pinCode'].value;
    // }
    // localStorage.setItem("EmpData", JSON.stringify(this.employeeList)); // Save the updated list to localStorage

    this.reset(); // Reset the form after updating
  }

  // Method to delete
  onDelete(id: number): void {
    const employees = this.employees; // Get the list of employees

    const index = employees.findIndex(e => e.empId === id); // Find the employee by ID

    if (index > -1) {
      const isDelete = confirm("Are you sure you want to delete this item?"); // Confirm before deletion

      if (isDelete) {
        // Remove the employee from the cache and the list
        if (this.cache.unsetSync(`employees[${index}]`)){
          employees.splice(index, 1);
        }
      }
    }

    this.employeeList = employees; // Refresh the list

    // const isDelete = confirm("Are you sure you want to delete this item?"); // Confirm before deletion
    // if (isDelete) {
    //   const index = this.employeeList.findIndex(m => m.empId == id); // Find the employee by ID
    //   this.employeeList.splice(index, 1); // Remove the employee from the list
    //   localStorage.setItem("EmpData", JSON.stringify(this.employeeList)); // Save the updated list to localStorage
    // }
  }
}
