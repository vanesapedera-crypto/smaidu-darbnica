import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { error } = await supabase.from("bookings").insert([
      {
        program: body.program,
        parent_name: body.parentName,
        phone: body.phone,
        email: body.email,
        children_count: body.childrenCount,
        child_age: body.childAge,
        event_date: body.eventDate,
        event_time: body.eventTime, 
        address: body.address,
        accept_travel_fee: body.acceptTravelFee,
        location: body.location,
        message: body.message,
      },
    ]);

    if (error) {
      console.error(error);

      return NextResponse.json(
        {
       success: false,
       error: error.message,
       },
       { status: 500 }
       );
      }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
    {
    success: false,
    error: "Servera kļūda.",
    },
    { status: 500 }
    );
  }
}