from django.contrib import admin
from .models import AccountsReceivable, AccountsPayable, Invoice, Payment


@admin.register(AccountsReceivable)
class AccountsReceivableAdmin(admin.ModelAdmin):
    list_display = ('description', 'amount', 'due_date', 'status', 'tenant', 'client')
    list_filter = ('tenant', 'status')


@admin.register(AccountsPayable)
class AccountsPayableAdmin(admin.ModelAdmin):
    list_display = ('description', 'amount', 'due_date', 'status', 'tenant')
    list_filter = ('tenant', 'status')


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('type', 'amount', 'due_date', 'status', 'tenant', 'client')
    list_filter = ('tenant', 'status')


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('amount', 'payment_date', 'method', 'tenant', 'client')
    list_filter = ('tenant', 'method')
