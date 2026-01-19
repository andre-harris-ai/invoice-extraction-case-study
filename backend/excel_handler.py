import pandas as pd
import os
from datetime import datetime
from typing import Optional, Dict, List
from pathlib import Path

class ExcelDatabase:
    def __init__(self, db_path: str = "invoice_database.xlsx"):
        self.db_path = db_path
        self.ensure_database_exists()
    
    def ensure_database_exists(self):
        """Create Excel file with SalesOrderHeader and SalesOrderDetail sheets if it doesn't exist"""
        if not os.path.exists(self.db_path):
            # Create empty DataFrames with proper structure
            header_df = pd.DataFrame(columns=[
                'OrderID',
                'InvoiceNumber',
                'OrderDate',
                'InvoiceDate',
                'DueDate',
                'CustomerID',
                'CustomerName',
                'VendorName',
                'BillingAddress',
                'ShippingAddress',
                'SubTotal',
                'Tax',
                'TotalAmount',
                'Currency',
                'Status',
                'CreatedAt',
                'UpdatedAt'
            ])
            
            detail_df = pd.DataFrame(columns=[
                'OrderID',
                'LineNumber',
                'ItemDescription',
                'Quantity',
                'UnitPrice',
                'LineTotal',
                'CreatedAt'
            ])
            
            with pd.ExcelWriter(self.db_path, engine='openpyxl') as writer:
                header_df.to_excel(writer, sheet_name='SalesOrderHeader', index=False)
                detail_df.to_excel(writer, sheet_name='SalesOrderDetail', index=False)
    
    def get_next_order_id(self) -> int:
        """Get the next available OrderID"""
        try:
            header_df = pd.read_excel(self.db_path, sheet_name='SalesOrderHeader')
            if len(header_df) == 0:
                return 1
            return int(header_df['OrderID'].max()) + 1
        except:
            return 1
    
    def save_invoice(self, invoice_data: Dict) -> Dict:
        """Save invoice data to Excel database"""
        try:
            # Read existing data
            header_df = pd.read_excel(self.db_path, sheet_name='SalesOrderHeader')
            detail_df = pd.read_excel(self.db_path, sheet_name='SalesOrderDetail')
            
            # Generate OrderID
            order_id = self.get_next_order_id()
            now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            
            # Prepare header row
            header_row = {
                'OrderID': order_id,
                'InvoiceNumber': invoice_data.get('invoice_number', ''),
                'OrderDate': invoice_data.get('invoice_date', ''),
                'InvoiceDate': invoice_data.get('invoice_date', ''),
                'DueDate': invoice_data.get('due_date', ''),
                'CustomerID': '',  # Can be added later
                'CustomerName': invoice_data.get('customer_name', ''),
                'VendorName': invoice_data.get('vendor_name', ''),
                'BillingAddress': invoice_data.get('billing_address', ''),
                'ShippingAddress': invoice_data.get('shipping_address', ''),
                'SubTotal': invoice_data.get('subtotal', 0),
                'Tax': invoice_data.get('tax', 0),
                'TotalAmount': invoice_data.get('total_amount', 0),
                'Currency': invoice_data.get('currency', ''),
                'Status': 'Pending',
                'CreatedAt': now,
                'UpdatedAt': now
            }
            
            # Add header row
            header_df = pd.concat([header_df, pd.DataFrame([header_row])], ignore_index=True)
            
            # Prepare detail rows
            line_items = invoice_data.get('line_items', [])
            detail_rows = []
            for idx, item in enumerate(line_items, start=1):
                detail_row = {
                    'OrderID': order_id,
                    'LineNumber': idx,
                    'ItemDescription': item.get('description', ''),
                    'Quantity': item.get('quantity', 0),
                    'UnitPrice': item.get('unit_price', 0),
                    'LineTotal': item.get('total_price', 0),
                    'CreatedAt': now
                }
                detail_rows.append(detail_row)
            
            if detail_rows:
                detail_df = pd.concat([detail_df, pd.DataFrame(detail_rows)], ignore_index=True)
            
            # Write back to Excel
            with pd.ExcelWriter(self.db_path, engine='openpyxl') as writer:
                header_df.to_excel(writer, sheet_name='SalesOrderHeader', index=False)
                detail_df.to_excel(writer, sheet_name='SalesOrderDetail', index=False)
            
            return {
                'success': True,
                'order_id': order_id,
                'message': f'Invoice saved with OrderID: {order_id}'
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def update_invoice(self, order_id: int, invoice_data: Dict) -> Dict:
        """Update existing invoice in Excel database"""
        try:
            # Read existing data
            header_df = pd.read_excel(self.db_path, sheet_name='SalesOrderHeader')
            detail_df = pd.read_excel(self.db_path, sheet_name='SalesOrderDetail')
            
            # Update header
            mask = header_df['OrderID'] == order_id
            if not mask.any():
                return {'success': False, 'error': f'OrderID {order_id} not found'}
            
            now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            header_df.loc[mask, 'InvoiceNumber'] = invoice_data.get('invoice_number', '')
            header_df.loc[mask, 'InvoiceDate'] = invoice_data.get('invoice_date', '')
            header_df.loc[mask, 'DueDate'] = invoice_data.get('due_date', '')
            header_df.loc[mask, 'CustomerName'] = invoice_data.get('customer_name', '')
            header_df.loc[mask, 'VendorName'] = invoice_data.get('vendor_name', '')
            header_df.loc[mask, 'BillingAddress'] = invoice_data.get('billing_address', '')
            header_df.loc[mask, 'ShippingAddress'] = invoice_data.get('shipping_address', '')
            header_df.loc[mask, 'SubTotal'] = invoice_data.get('subtotal', 0)
            header_df.loc[mask, 'Tax'] = invoice_data.get('tax', 0)
            header_df.loc[mask, 'TotalAmount'] = invoice_data.get('total_amount', 0)
            header_df.loc[mask, 'Currency'] = invoice_data.get('currency', '')
            header_df.loc[mask, 'UpdatedAt'] = now
            
            # Remove old detail rows
            detail_df = detail_df[detail_df['OrderID'] != order_id]
            
            # Add new detail rows
            line_items = invoice_data.get('line_items', [])
            detail_rows = []
            for idx, item in enumerate(line_items, start=1):
                detail_row = {
                    'OrderID': order_id,
                    'LineNumber': idx,
                    'ItemDescription': item.get('description', ''),
                    'Quantity': item.get('quantity', 0),
                    'UnitPrice': item.get('unit_price', 0),
                    'LineTotal': item.get('total_price', 0),
                    'CreatedAt': now
                }
                detail_rows.append(detail_row)
            
            if detail_rows:
                detail_df = pd.concat([detail_df, pd.DataFrame(detail_rows)], ignore_index=True)
            
            # Write back to Excel
            with pd.ExcelWriter(self.db_path, engine='openpyxl') as writer:
                header_df.to_excel(writer, sheet_name='SalesOrderHeader', index=False)
                detail_df.to_excel(writer, sheet_name='SalesOrderDetail', index=False)
            
            return {
                'success': True,
                'order_id': order_id,
                'message': f'Invoice {order_id} updated successfully'
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_all_invoices(self) -> Dict:
        """Get all invoices from database"""
        try:
            header_df = pd.read_excel(self.db_path, sheet_name='SalesOrderHeader')
            detail_df = pd.read_excel(self.db_path, sheet_name='SalesOrderDetail')
            
            # Convert to dict format
            headers = header_df.to_dict('records')
            details = detail_df.to_dict('records')
            
            return {
                'success': True,
                'headers': headers,
                'details': details
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_invoice_by_id(self, order_id: int) -> Dict:
        """Get specific invoice by OrderID"""
        try:
            header_df = pd.read_excel(self.db_path, sheet_name='SalesOrderHeader')
            detail_df = pd.read_excel(self.db_path, sheet_name='SalesOrderDetail')
            
            header = header_df[header_df['OrderID'] == order_id]
            if len(header) == 0:
                return {'success': False, 'error': f'OrderID {order_id} not found'}
            
            details = detail_df[detail_df['OrderID'] == order_id].to_dict('records')
            
            return {
                'success': True,
                'header': header.to_dict('records')[0],
                'details': details
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
