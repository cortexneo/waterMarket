import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, Inject, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgbActiveModal, NgbDateStruct, NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { Order } from 'app/components/transaction/pruchase-modal/pruchase-modal.component';
import { UpdatePasswordComponent } from './update-password/update-password.component';
import { UpdateProfileComponent } from './update-profile/update-profile.component';

@Component({
    selector: 'app-admin',
    templateUrl: './admin.component.html',
    styleUrls: ['./admin.component.scss']
})

export class AdminComponent implements OnInit {

    page = 1;
    pageSize = 4;
    collectionSize: number;
    orderPage = 1;
    orderPageSize = 4;
    orderCollectionSize: number;
    customers: ICustomer[];
    orders: IOrder[];
    salesOrderReport: IOrder[];
    showSalesReport = false;
    totalSales: number;
    model: NgbDateStruct;

    ngbModalOptions: NgbModalOptions = {
        backdrop: 'static',
        keyboard: false
    };

    constructor(public http: HttpClient,
        @Inject('BASE_URL') public baseUrl: string, public router: Router,
        private modalService: NgbModal, private ref: ChangeDetectorRef) { }

    ngOnInit() {
        this.getCustomers();
        this.getSalesReport();
    }

    getCustomers() {
        this.http.get<ICustomer[]>(this.baseUrl + 'Customer').subscribe(result => {
            if (!result) return;
            this.collectionSize = result.length;
            this.customers = result.slice((this.page - 1) * this.pageSize, (this.page - 1) * this.pageSize + this.pageSize);
        }, error => console.error(error));
    }

    getSalesReport() {
        this.http.get<IOrder[]>(this.baseUrl + 'Order').subscribe(result => {
            if (!result) return;
            this.orderCollectionSize = result.length;
            this.salesOrderReport = result;
            this.totalSales = result.map(x => x.amount).reduce((a, b) => a + b, 0);
        }, error => console.error(error));
    }

    onDateChange() {
        this.http.get<IOrder[]>(this.baseUrl + 'Order').subscribe(result => {
            if (!result) return;
            this.orderCollectionSize = result.length;
            result.forEach(x => {
                x.purchasedDate = new Date(x.purchasedDate);
            });
            this.salesOrderReport = result.filter(x => (x.purchasedDate.getMonth() + 1) === this.model.month
                && x.purchasedDate.getDate() === this.model.day && x.purchasedDate.getFullYear() === this.model.year)

            this.totalSales = this.salesOrderReport.map(x => x.amount).reduce((a, b) => a + b, 0);
            this.ref.detectChanges();
        }, error => console.error(error));
    }

    logout() {
        const modalRef = this.modalService.open(NgbdModalConfirm, this.ngbModalOptions);
        modalRef.componentInstance.modalTitle = 'Log out';
        modalRef.componentInstance.message = 'Are you sure you want to log out?';

        modalRef.result.then((message) => {
            if (!!message && message.toUpperCase() === 'LOG OUT') {
                this.router.navigate(['/home'])
            }
        });
    }

    changePassword() {
        const modalRef = this.modalService.open(UpdatePasswordComponent, this.ngbModalOptions);

        modalRef.result.then((message) => {
            if (!!message && message.toUpperCase() == 'SUCCESSFULLY UPDATED') {
                modalRef.close();
            }
        })
    }

    showSales() {
        this.showSalesReport = !this.showSalesReport;
    }

    updateCustomer(customer: ICustomer) {
        const modalRef = this.modalService.open(UpdateProfileComponent, this.ngbModalOptions);
        modalRef.componentInstance.customerDetails = customer;

        modalRef.result.then((message) => {
            if (!!message) {
                customer.name = message.name;
                customer.address = message.address;
                customer.contactNumber = message.contactNumber;
                customer.order.orderedProducts = message.order;
                this.http.put<ICustomer>(this.baseUrl + `Customer?customerID=${customer.customerID}`, customer).subscribe(res => {
                    const modalRef = this.modalService.open(NgbdModalConfirm, this.ngbModalOptions);
                    modalRef.componentInstance.modalTitle = 'Record';
                    modalRef.componentInstance.message = 'Successfully Updated.';
                    this.getCustomers();
                })
            }
        });
    }

    deleteCustomer(customer: ICustomer) {
        const modalRef = this.modalService.open(NgbdModalConfirm, this.ngbModalOptions);
        modalRef.componentInstance.modalTitle = 'Remove Record';
        modalRef.componentInstance.message = 'Are you sure you want to delete this record?';

        modalRef.result.then((message) => {
            if (!!message && message.toUpperCase() === 'REMOVE RECORD') {
                this.http.delete<ICustomer>(this.baseUrl + `Customer?customerID=${customer.customerID}`).subscribe(res => {
                    const modalRef = this.modalService.open(NgbdModalConfirm, this.ngbModalOptions);
                    modalRef.componentInstance.modalTitle = 'Record';
                    modalRef.componentInstance.message = 'Successfully Deleted.';
                    this.getCustomers();
                })
            }
        });
    }
}

@Component({
    selector: 'ngbd-modal-confirm',
    template: `
    <div class="modal-header" style="padding-top: 0 !important;">
      <h4 class="modal-title" id="modal-title">{{ modalTitle }}</h4>
      <button type="button" class="close" aria-describedby="modal-title" (click)="modal.close()">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
    <div class="modal-body">
      <p><strong>{{ message }}</strong></p>
    </div>
    <div class="modal-footer">
      <button [hidden]="modalTitle.toUpperCase() === 'RECORD'" type="button" class="btn btn-outline-secondary" style="background-color: #66615B !important" (click)="modal.close()">Cancel</button>
      <button type="button" class="btn btn-danger" (click)="modal.close(modalTitle)">Ok</button>
    </div>
    `
})
export class NgbdModalConfirm {

    @Input() modalTitle: any;
    @Input() message: any;

    constructor(public modal: NgbActiveModal) { }
}

export interface ICustomer {
    customerID: string;
    name: string;
    address: string;
    contactNumber: string;
    orderID: string;
    order: Order;
}

export interface IOrder {
    orderID: string;
    orderedProducts: string;
    amount: number;
    purchasedDate: Date;
}