import { NextFunction, Request, Response } from "express";

import Booking from "../infrastructure/schemas/Booking";
import { CreateBookingDTO } from "../domain/dtos/booking";
import ValidationError from "../domain/errors/validation-error";
import { clerkClient } from "@clerk/express";

export const createBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const booking = CreateBookingDTO.safeParse(req.body);
    console.log(booking);
    // Validate the request data
    if (!booking.success) {
      throw new ValidationError(booking.error.message)
    }

    const user = req.auth;

    // Add the booking
    await Booking.create({
      hotelId: booking.data.hotelId,
      userId: user.userId,
      checkIn: booking.data.checkIn,
      checkOut: booking.data.checkOut,
      roomNumber: booking.data.roomNumber,
    });

    // Return the response
    res.status(201).send();
    return;
  } catch (error) {
    next(error);
  }
};

export const getAllBookingsForHotel = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const hotelId = req.params.hotelId;
    const bookings = await Booking.find({ hotelId: hotelId });
    const bookingsWithUser = await Promise.all(bookings.map(async (el) => {
      const user = await clerkClient.users.getUser(el.userId);
      return { _id: el._id, hotelId: el.hotelId, checkIn: el.checkIn, checkOut: el.checkOut, roomNumber: el.roomNumber, user: { id: user.id, firstName: user.firstName, lastName: user.lastName } }
    }))

    res.status(200).json(bookingsWithUser);
    return;
  } catch (error) {
    next(error);
  }
};

export const getAllBookings = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const bookings = await Booking.find();

    res.status(200).json(bookings);
    return;
  } catch (error) {
    next(error);
  }
};

export const getMyBookings = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.auth;
    const bookings = await Booking.find({ userId: user.userId }).populate("hotelId");

    res.status(200).json(bookings);
    return;
  } catch (error) {
    next(error);
  }
};

export const cancelBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const bookingId = req.params.id;
    const user = req.auth;

    const booking = await Booking.findOne({ 
      _id: bookingId, 
      userId: user.userId 
    });

    if (!booking) {
      res.status(404).json({ message: "Booking not found or not authorized" });
      return;
    }

    // Validation: Cannot cancel if the check-in date is in the past
    const checkInDate = new Date(booking.checkIn);
    const currentDate = new Date();
    
    // Reset times to compare just the dates
    checkInDate.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);

    if (checkInDate <= currentDate) {
      res.status(400).json({ message: "Cannot cancel a booking that has already started or is in the past." });
      return;
    }

    // Delete the booking after validation passes
    await Booking.findByIdAndDelete(bookingId);

    res.status(200).json({ message: "Booking cancelled successfully" });
    return;
  } catch (error) {
    next(error);
  }
};
