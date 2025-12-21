import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { CreateEmiTransactionRequest, EmiTransaction } from '@/types';

export async function POST(request: NextRequest) {
    try {
        const body: CreateEmiTransactionRequest = await request.json();

        // Validate required fields
        if (!body.loan_id || !body.emi_date || !body.month_number || !body.transaction_type || body.amount_paid === undefined) {
            return NextResponse.json(
                { error: 'Missing required fields: loan_id, emi_date, month_number, transaction_type, and amount_paid are required' },
                { status: 400 }
            );
        }

        // Validate transaction type
        if (!['emi', 'part_payment'].includes(body.transaction_type)) {
            return NextResponse.json(
                { error: 'Invalid transaction type. Must be "emi" or "part_payment"' },
                { status: 400 }
            );
        }

        // Validate amounts are non-negative
        if (body.amount_paid < 0 || body.principal_component < 0 || body.interest_component < 0) {
            return NextResponse.json(
                { error: 'Amounts cannot be negative' },
                { status: 400 }
            );
        }

        // Check if transaction already exists for this loan, month AND transaction type
        // This allows separate rows for 'emi' and 'part_payment' in the same month
        const { data: existingTransaction } = await supabase
            .from('emi_transactions')
            .select('id')
            .eq('loan_id', body.loan_id)
            .eq('month_number', body.month_number)
            .eq('transaction_type', body.transaction_type)
            .maybeSingle();

        let data, error;

        if (existingTransaction) {
            // Update existing transaction
            const updateResult = await supabase
                .from('emi_transactions')
                .update({
                    loan_id: body.loan_id,
                    emi_date: body.emi_date,
                    amount_paid: body.amount_paid,
                    principal_component: body.principal_component,
                    interest_component: body.interest_component,
                })
                .eq('id', existingTransaction.id)
                .select()
                .single();

            data = updateResult.data;
            error = updateResult.error;
        } else {
            // Insert new transaction
            const insertResult = await supabase
                .from('emi_transactions')
                .insert([
                    {
                        loan_id: body.loan_id,
                        emi_date: body.emi_date,
                        month_number: body.month_number,
                        transaction_type: body.transaction_type,
                        amount_paid: body.amount_paid,
                        principal_component: body.principal_component,
                        interest_component: body.interest_component,
                    }
                ])
                .select()
                .single();

            data = insertResult.data;
            error = insertResult.error;
        }

        if (error) {
            console.error('Supabase error:', error);
            return NextResponse.json(
                { error: 'Failed to save transaction', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json(
            {
                message: existingTransaction ? 'Transaction updated successfully' : 'Transaction created successfully',
                data: data as EmiTransaction,
                isUpdate: !!existingTransaction
            },
            { status: existingTransaction ? 200 : 201 }
        );

    } catch (error) {
        console.error('Error creating EMI transaction:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const monthNumber = searchParams.get('month_number');
        const loanId = searchParams.get('loan_id');

        let query = supabase
            .from('emi_transactions')
            .select('*')
            .order('emi_date', { ascending: true });

        if (monthNumber) {
            query = query.eq('month_number', parseInt(monthNumber));
        }

        if (loanId) {
            query = query.eq('loan_id', loanId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Supabase error:', error);
            return NextResponse.json(
                { error: 'Failed to fetch transactions', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json(
            {
                message: 'Transactions fetched successfully',
                data: data as EmiTransaction[]
            },
            { status: 200 }
        );

    } catch (error) {
        console.error('Error fetching EMI transactions:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, ...updateData } = body;

        if (!id) {
            return NextResponse.json(
                { error: 'Transaction ID is required' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('emi_transactions')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
            return NextResponse.json(
                { error: 'Failed to update transaction', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json(
            {
                message: 'Transaction updated successfully',
                data: data as EmiTransaction
            },
            { status: 200 }
        );

    } catch (error) {
        console.error('Error updating EMI transaction:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'Transaction ID is required' },
                { status: 400 }
            );
        }

        const { error } = await supabase
            .from('emi_transactions')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Supabase error:', error);
            return NextResponse.json(
                { error: 'Failed to delete transaction', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { message: 'Transaction deleted successfully' },
            { status: 200 }
        );

    } catch (error) {
        console.error('Error deleting EMI transaction:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
