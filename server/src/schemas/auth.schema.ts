import { z } from "zod";

export const registerSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  apellidos: z.string().min(1, "Los apellidos son obligatorios"),
  profesion: z.string().nullable().optional(),
  edad: z.number().int().nullable().optional(),
  correo: z.string().email("Correo inválido"),
  contraseña: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export const loginSchema = z.object({
  correo: z.string().email("Correo inválido"),
  contraseña: z.string().min(1, "La contraseña es obligatoria"),
});

export const forgotPasswordSchema = z.object({
  correo: z.string().email("Correo inválido"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "El token es obligatorio"),
  contraseña: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres"),
});
