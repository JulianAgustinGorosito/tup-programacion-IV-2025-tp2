import { param, validationResult } from "express-validator";

export const validarId = param("id").isInt({ min: 1 });

export const verificarValidaciones = (req, res, next) => {
  const validacion = validationResult(req);
  if (!validacion.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "falla en validacion",
      errores: validacion.array(),
    });
  }
  next();
};
