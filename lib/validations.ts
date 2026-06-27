import { z } from "zod";
import { validateGstin } from "@/lib/gst";

const gstinSchema = z
  .string()
  .optional()
  .or(z.literal(""))
  .refine(
    (val) => !val || validateGstin(val).valid,
    { message: "Invalid GSTIN — check format and checksum" }
  );

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z
      .string()
      .regex(/^[6-9]\d{9}$/, "Enter valid 10-digit Indian mobile number"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain uppercase letter")
      .regex(/[a-z]/, "Must contain lowercase letter")
      .regex(/[0-9]/, "Must contain a number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const sellerStep1Schema = z
  .object({
    email: z.string().email("Invalid email address"),
    phone: z
      .string()
      .regex(/^[6-9]\d{9}$/, "Enter valid 10-digit Indian mobile number"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain uppercase letter")
      .regex(/[a-z]/, "Must contain lowercase letter")
      .regex(/[0-9]/, "Must contain a number"),
    confirmPassword: z.string(),
    emailVerified: z.boolean(),
    phoneVerified: z.boolean(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.emailVerified, {
    message: "Please verify your email through OTP",
    path: ["emailVerified"],
  })
  .refine((data) => data.phoneVerified, {
    message: "Please verify your mobile number through OTP",
    path: ["phoneVerified"],
  });

export const sellerStep2Schema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  businessType: z.string().min(1, "Select business type"),
  gstNumber: gstinSchema,
  panNumber: z
    .string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN number")
    .optional()
    .or(z.literal("")),
  bankAccount: z.string().min(9, "Invalid bank account").optional().or(z.literal("")),
  bankIfsc: z
    .string()
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code")
    .optional()
    .or(z.literal("")),
  pickupAddress: z.string().min(10, "Pickup address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().regex(/^\d{6}$/, "Enter valid 6-digit pincode"),
  gstVerified: z.boolean().optional(),
  gstLegalName: z.string().optional(),
}).refine(
  (data) => !data.gstNumber || data.gstVerified === true,
  { message: "Please verify GSTIN before registering", path: ["gstNumber"] }
);

export const otpSendSchema = z.object({
  target: z.string().min(1),
  type: z.enum(["email", "phone"]),
});

export const otpVerifySchema = z.object({
  target: z.string().min(1),
  type: z.enum(["email", "phone"]),
  code: z.string().regex(/^\d{4}$/, "OTP must be 4 digits"),
});

export const buyerRegisterSchema = registerSchema
  .extend({
    emailVerified: z.literal(true, { message: "Please verify email OTP" }),
    phoneVerified: z.literal(true, { message: "Please verify mobile OTP" }),
  });

export const productSchema = z.object({
  name: z.string().min(3, "Product name is required"),
  description: z.string().min(10, "Description is required"),
  price: z.number().positive("Price must be positive"),
  mrp: z.number().positive("MRP must be positive"),
  stock: z.number().int().min(0),
  categoryId: z.string().min(1),
  brand: z.string().optional(),
  images: z.array(z.string().url()).min(1, "At least one image required"),
});

export const addressSchema = z.object({
  name: z.string().min(2),
  phone: z.string().regex(/^[6-9]\d{9}$/),
  line1: z.string().min(5),
  line2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().regex(/^\d{6}$/),
  isDefault: z.boolean().optional(),
});

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

export const checkoutSchema = z.object({
  addressId: z.string().min(1),
  paymentMethod: z.enum(["COD", "UPI", "CARD", "WALLET"]),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type SellerStep1Input = z.infer<typeof sellerStep1Schema>;
export type SellerStep2Input = z.infer<typeof sellerStep2Schema>;
