import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { CreateEmiTransactionRequest, EmiTransaction } from '@/types';

export async function POST(request: NextRequest) {
    try {
        const body: CreateEmiTransactionRequest = await request.json();

        // Reject local IDs - they should not be used with Supabase
        if (body.loan_id.startsWith('local-')) {
            return NextResponse.json(
                { error: 'Cannot save transactions with local loan ID. Please save loan details first to get a Supabase ID.' },
                { status: 400 }
            );
        }

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
            // Reject local IDs
            if (loanId.startsWith('local-')) {
                return NextResponse.json(
                    { error: 'Cannot fetch transactions with local loan ID.' },
                    { status: 400 }
                );
            }
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
        const loanId = searchParams.get('loan_id');
        const transactionType = searchParams.get('transaction_type');
        const fromMonth = searchParams.get('from_month');

        // Single delete by ID
        if (id) {
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
        }

        // Batch delete by loan_id, transaction_type, and month range
        if (loanId && transactionType && fromMonth) {
            const { data, error } = await supabase
                .from('emi_transactions')
                .delete()
                .eq('loan_id', loanId)
                .eq('transaction_type', transactionType)
                .gte('month_number', parseInt(fromMonth))
                .select();

            if (error) {
                console.error('Supabase batch delete error:', error);
                return NextResponse.json(
                    { error: 'Failed to delete transactions', details: error.message },
                    { status: 500 }
                );
            }

            return NextResponse.json(
                {
                    message: `Successfully deleted ${data?.length || 0} transactions`,
                    count: data?.length || 0
                },
                { status: 200 }
            );
        }

        return NextResponse.json(
            { error: 'Either id or (loan_id, transaction_type, from_month) is required' },
            { status: 400 }
        );

    } catch (error) {
        console.error('Error deleting EMI transaction:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

// PATCH - Batch create/update EMI transactions
export async function PATCH(request: NextRequest) {
    try {
        const body: { transactions: CreateEmiTransactionRequest[] } = await request.json();

        if (!body.transactions || !Array.isArray(body.transactions) || body.transactions.length === 0) {
            return NextResponse.json(
                { error: 'Invalid request: transactions array is required and must not be empty' },
                { status: 400 }
            );
        }

        // Validate all transactions
        for (const transaction of body.transactions) {
            if (!transaction.loan_id || !transaction.emi_date || !transaction.month_number ||
                !transaction.transaction_type || transaction.amount_paid === undefined) {
                return NextResponse.json(
                    { error: 'Missing required fields in one or more transactions' },
                    { status: 400 }
                );
            }

            if (!['emi', 'part_payment'].includes(transaction.transaction_type)) {
                return NextResponse.json(
                    { error: 'Invalid transaction type in one or more transactions' },
                    { status: 400 }
                );
            }
        }

        const loanId = body.transactions[0].loan_id;
        const transactionType = body.transactions[0].transaction_type;

        // Reject local IDs
        if (loanId.startsWith('local-')) {
            return NextResponse.json(
                { error: 'Cannot save transactions with local loan ID. Please save loan details first.' },
                { status: 400 }
            );
        }

        // Fetch existing transactions for this loan and transaction type
        const { data: existingTransactions, error: fetchError } = await supabase
            .from('emi_transactions')
            .select('id, month_number')
            .eq('loan_id', loanId)
            .eq('transaction_type', transactionType);

        if (fetchError) {
            console.error('Error fetching existing transactions:', fetchError);
            return NextResponse.json(
                { error: 'Failed to fetch existing transactions', details: fetchError.message },
                { status: 500 }
            );
        }

        // Create a map of existing transactions by month_number
        const existingMap = new Map(
            (existingTransactions || []).map(t => [t.month_number, t.id])
        );

        const toUpdate: Array<{ id: string; data: any }> = [];
        const toInsert: any[] = [];

        // Separate transactions into updates and inserts
        for (const transaction of body.transactions) {
            const transactionData = {
                loan_id: transaction.loan_id,
                emi_date: transaction.emi_date,
                month_number: transaction.month_number,
                transaction_type: transaction.transaction_type,
                amount_paid: transaction.amount_paid,
                principal_component: transaction.principal_component,
                interest_component: transaction.interest_component,
            };

            const existingId = existingMap.get(transaction.month_number);
            if (existingId) {
                toUpdate.push({ id: existingId, data: transactionData });
            } else {
                toInsert.push(transactionData);
            }
        }

        let updatedCount = 0;
        let insertedCount = 0;

        // Perform updates
        if (toUpdate.length > 0) {
            for (const { id, data } of toUpdate) {
                const { error: updateError } = await supabase
                    .from('emi_transactions')
                    .update(data)
                    .eq('id', id);

                if (updateError) {
                    console.error('Error updating transaction:', updateError);
                } else {
                    updatedCount++;
                }
            }
        }

        // Perform inserts
        if (toInsert.length > 0) {
            const { data: insertedData, error: insertError } = await supabase
                .from('emi_transactions')
                .insert(toInsert)
                .select();

            if (insertError) {
                console.error('Error inserting transactions:', insertError);
                return NextResponse.json(
                    { error: 'Failed to insert transactions', details: insertError.message },
                    { status: 500 }
                );
            }

            insertedCount = insertedData?.length || 0;
        }

        return NextResponse.json(
            {
                message: `Successfully processed ${body.transactions.length} transactions (${insertedCount} created, ${updatedCount} updated)`,
                count: insertedCount + updatedCount,
                inserted: insertedCount,
                updated: updatedCount
            },
            { status: 200 }
        );

    } catch (error) {
        console.error('Error in batch EMI transaction:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
