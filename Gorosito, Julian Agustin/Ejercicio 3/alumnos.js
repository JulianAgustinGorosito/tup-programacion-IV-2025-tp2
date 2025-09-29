import express from "express";
import { db } from "./db.js";
import { validarId, verificarValidaciones } from "./validaciones.js";
import { query, body } from "express-validator";

const router = express.Router();

const validarFiltros = [
  query("materiaId").isInt({ min: 1 }).optional(),
  query("nombre").isAlpha("es-ES").optional(),
];

const validarAlumno = [
  body("nombre").trim().isAlpha("es-ES", { ignore: " " }).isLength({ max: 50 }),
  body("materiaId").isInt({ min: 1 }),
  body("nota1").isInt({ min: 0, max: 10 }),
  body("nota2").isInt({ min: 0, max: 10 }),
  body("nota3").isInt({ min: 0, max: 10 }),
];

router.get("/", validarFiltros, verificarValidaciones, async (req, res) => {
  const filtros = [];
  const params = [];
  const { materiaId, nombre } = req.query;

  if (materiaId !== undefined) {
    filtros.push("a.materia_id = ?");
    params.push(Number(materiaId));
  }
  if (nombre) {
    filtros.push("a.nombre LIKE ?");
    params.push(`%${nombre}%`);
  }

  let sql =
    "SELECT a.id, a.nombre, a.nota1, a.nota2, a.nota3, " +
    "       m.id AS materiaId, m.nombre AS materia " +
    "FROM alumnos a " +
    "JOIN materias m ON a.materia_id = m.id ";

  if (filtros.length > 0) sql += "WHERE " + filtros.join(" AND ") + " ";

  sql += "ORDER BY a.nombre";

  const [rows] = await db.execute(sql, params);
  res.json({ success: true, data: rows });
});

router.get("/:id", validarId, verificarValidaciones, async (req, res) => {
  const id = Number(req.params.id);
  const [rows] = await db.execute("SELECT * FROM alumnos WHERE id=?", [id]);

  if (rows.length === 0) {
    return res.status(404).json({ success: false, message: "alumno no encontrado" });
  }

  res.json({ success: true, data: rows[0] });
});

router.post("/", validarAlumno, verificarValidaciones, async (req, res) => {
  const { nombre, materiaId, nota1, nota2, nota3 } = req.body;
  const nombreNorm = nombre.trim();

  const [dup] = await db.execute(
    "SELECT id FROM alumnos WHERE LOWER(nombre)=LOWER(?) AND materia_id=?",
    [nombreNorm, materiaId]
  );
  if (dup.length > 0) {
    return res.status(400).json({
      success: false,
      message: "ya existe el alumno",
    });
  }

  const [result] = await db.execute(
    "INSERT INTO alumnos (nombre, materia_id, nota1, nota2, nota3) VALUES (?,?,?,?,?)",
    [nombreNorm, materiaId, nota1, nota2, nota3]
  );

  res.status(201).json({
    success: true,
    data: { id: result.insertId, nombre: nombreNorm, materiaId, nota1, nota2, nota3 },
  });
});

router.put(
  "/:id",
  validarId,
  validarAlumno,
  verificarValidaciones,
  async (req, res) => {
    const id = Number(req.params.id);
    const { nombre, materiaId, nota1, nota2, nota3 } = req.body;
    const nombreNorm = nombre.trim();

    const [dup] = await db.execute(
      "SELECT id FROM alumnos WHERE LOWER(nombre)=LOWER(?) AND materia_id=? AND id<>?",
      [nombreNorm, materiaId, id]
    );
    if (dup.length > 0) {
      return res.status(400).json({
        success: false,
        message: "ya existe otro alumno con ese nombre en esa materia",
      });
    }

    await db.execute(
      "UPDATE alumnos SET nombre=?, materia_id=?, nota1=?, nota2=?, nota3=? WHERE id=?",
      [nombreNorm, materiaId, nota1, nota2, nota3, id]
    );

    res.json({
      success: true,
      data: { id, nombre: nombreNorm, materiaId, nota1, nota2, nota3 },
    });
  }
);

router.delete("/:id", validarId, verificarValidaciones, async (req, res) => {
  const id = Number(req.params.id);
  await db.execute("DELETE FROM alumnos WHERE id=?", [id]);
  res.json({ success: true, data: id });
});

export default router;
    