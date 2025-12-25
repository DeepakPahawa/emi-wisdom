import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/route-client';
import { CreateLoanDetailsRequest, LoanDetailsDB } from '@/types';

export async function POST(request: NextRequest) {
    try {
        // Get the authenticated user (validates with Supabase Auth server for security)
        const supabase = createClient(request);
        const { data: { user }, error: authError } = await supabase.auth.getUser();


        if (!user) {
            console.error('[API /loan-details POST] No authenticated user - returning 401');
            return NextResponse.json(
                { error: 'Unauthorized. Please login to save loan details.' },
                { status: 401 }
            );
        }

        const userId = user.id;
        const body: CreateLoanDetailsRequest = await request.json();

        // Validate required fields
        if (!body.loan_number || !body.principal_amount || !body.original_interest_rate ||
            !body.current_interest_rate || !body.emi_start_date || !body.loan_tenure_months ||
            !body.bank_name || !body.loan_label) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Validate loan label
        if (!['HomeLoan', 'PersonalLoan', 'CarLoan', 'Other'].includes(body.loan_label)) {
            return NextResponse.json(
                { error: 'Invalid loan label. Must be HomeLoan, PersonalLoan, CarLoan, or Other' },
                { status: 400 }
            );
        }

        // Validate amounts are positive
        if (body.principal_amount <= 0 || body.original_interest_rate < 0 || body.current_interest_rate < 0) {
            return NextResponse.json(
                { error: 'Invalid amounts. Principal must be positive, interest rates must be non-negative' },
                { status: 400 }
            );
        }

        // Check if loan with this loan_number already exists for this user
        const { data: existingLoan } = await supabase
            .from('loan_details')
            .select('id')
            .eq('loan_number', body.loan_number)
            .eq('user_id', userId)
            .maybeSingle();

        let data, error;

        if (existingLoan) {
            // Update existing loan
            const updateResult = await supabase
                .from('loan_details')
                .update({
                    principal_amount: body.principal_amount,
                    original_interest_rate: body.original_interest_rate,
                    current_interest_rate: body.current_interest_rate,
                    emi_start_date: body.emi_start_date,
                    loan_tenure_months: body.loan_tenure_months,
                    bank_name: body.bank_name,
                    loan_label: body.loan_label,
                })
                .eq('id', existingLoan.id)
                .select()
                .single();

            data = updateResult.data;
            error = updateResult.error;
        } else {
            // Insert new loan with user_id
            const insertResult = await supabase
                .from('loan_details')
                .insert([
                    {
                        user_id: userId,
                        loan_number: body.loan_number,
                        principal_amount: body.principal_amount,
                        original_interest_rate: body.original_interest_rate,
                        current_interest_rate: body.current_interest_rate,
                        emi_start_date: body.emi_start_date,
                        loan_tenure_months: body.loan_tenure_months,
                        bank_name: body.bank_name,
                        loan_label: body.loan_label,
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
                { error: 'Failed to save loan details', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json(
            {
                message: existingLoan ? 'Loan details updated successfully' : 'Loan details created successfully',
                data: data as LoanDetailsDB,
                isUpdate: !!existingLoan
            },
            { status: existingLoan ? 200 : 201 }
        );

    } catch (error) {
        console.error('Error saving loan details:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        // Get the authenticated user (validates with Supabase Auth server for security)
        const supabase = createClient(request);
        const { data: { user }, error: authError } = await supabase.auth.getUser();


        if (!user) {
            console.error('[API /loan-details GET] No authenticated user - returning 401');
            return NextResponse.json(
                { error: 'Unauthorized. Please login to fetch loan details.' },
                { status: 401 }
            );
        }

        const userId = user.id;
        const { searchParams } = new URL(request.url);
        const loanNumber = searchParams.get('loan_number');
        const loanId = searchParams.get('id');

        let query = supabase
            .from('loan_details')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (loanNumber) {
            query = query.eq('loan_number', loanNumber);
        }

        if (loanId) {
            query = query.eq('id', loanId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Supabase error:', error);
            return NextResponse.json(
                { error: 'Failed to fetch loan details', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json(
            {
                message: 'Loan details fetched successfully',
                data: data as LoanDetailsDB[]
            },
            { status: 200 }
        );

    } catch (error) {
        console.error('Error fetching loan details:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const supabase = createClient(request);
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'Loan ID is required' },
                { status: 400 }
            );
        }

        const { error } = await supabase
            .from('loan_details')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Supabase error:', error);
            return NextResponse.json(
                { error: 'Failed to delete loan details', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { message: 'Loan details deleted successfully' },
            { status: 200 }
        );

    } catch (error) {
        console.error('Error deleting loan details:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
