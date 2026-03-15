import { isAuthenticated } from './middlewares/authentication-middleware';
import express from "express";
import {
  createBooking,
  getAllBookingsForHotel,
  getAllBookings,
  getMyBookings,
  cancelBooking,
} from "../application/booking";

const bookingsRouter = express.Router();

bookingsRouter.route("/").post(isAuthenticated, createBooking).get(isAuthenticated, getAllBookings);
bookingsRouter.route("/mine").get(isAuthenticated, getMyBookings);
bookingsRouter.route("/hotels/:hotelId").get(isAuthenticated, getAllBookingsForHotel);
bookingsRouter.route("/:id").delete(isAuthenticated, cancelBooking);

export default bookingsRouter;
