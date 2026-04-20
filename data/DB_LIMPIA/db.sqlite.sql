PRAGMA foreign_keys = ON;

-- ========================
-- ELIMINAR TABLAS SI EXISTEN
-- ========================
DROP TABLE IF EXISTS detalle_ventas;
DROP TABLE IF EXISTS ventas;
DROP TABLE IF EXISTS movimientos_inventario;
DROP TABLE IF EXISTS productos;
DROP TABLE IF EXISTS categorias;
DROP TABLE IF EXISTS proveedores;
DROP TABLE IF EXISTS sesiones;
DROP TABLE IF EXISTS configuracion;
DROP TABLE IF EXISTS usuarios;

-- ========================
-- USUARIOS
-- ========================
CREATE TABLE usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  rol TEXT NOT NULL CHECK(rol IN ('admin','cajero','inventario')),
  activo INTEGER DEFAULT 1,
  ultimo_acceso TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ========================
-- CATEGORIAS
-- ========================
CREATE TABLE categorias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  color TEXT DEFAULT '#3b82f6',
  activa INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ========================
-- PROVEEDORES
-- ========================
CREATE TABLE proveedores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  contacto TEXT,
  telefono TEXT,
  email TEXT,
  direccion TEXT,
  activo INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ========================
-- PRODUCTOS
-- ========================
CREATE TABLE productos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo_barras TEXT UNIQUE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  categoria_id INTEGER,
  proveedor_id INTEGER,
  precio_compra REAL DEFAULT 0,
  precio_venta REAL NOT NULL,
  stock_actual INTEGER DEFAULT 0,
  stock_minimo INTEGER DEFAULT 10,
  imagen_url TEXT,
  unidad TEXT DEFAULT 'unidad',
  activo INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL,
  FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE SET NULL
);

-- ========================
-- VENTAS
-- ========================
CREATE TABLE ventas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  numero_venta TEXT NOT NULL UNIQUE,
  usuario_id INTEGER,
  cliente_nombre TEXT,
  subtotal REAL NOT NULL,
  descuento REAL DEFAULT 0,
  impuesto REAL DEFAULT 0,
  total REAL NOT NULL,
  metodo_pago TEXT CHECK(metodo_pago IN ('efectivo','tarjeta','transferencia','mixto')),
  monto_recibido REAL,
  cambio REAL,
  estado TEXT DEFAULT 'completada' CHECK(estado IN ('completada','cancelada','pendiente')),
  notas TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- ========================
-- DETALLE VENTAS
-- ========================
CREATE TABLE detalle_ventas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  venta_id INTEGER NOT NULL,
  producto_id INTEGER NOT NULL,
  cantidad INTEGER NOT NULL,
  precio_unitario REAL NOT NULL,
  descuento REAL DEFAULT 0,
  subtotal REAL NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
  FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- ========================
-- INVENTARIO
-- ========================
CREATE TABLE movimientos_inventario (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  producto_id INTEGER NOT NULL,
  tipo TEXT NOT NULL CHECK(tipo IN ('entrada','salida','ajuste')),
  cantidad INTEGER NOT NULL,
  stock_anterior INTEGER NOT NULL,
  stock_nuevo INTEGER NOT NULL,
  motivo TEXT,
  usuario_id INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- ========================
-- TRIGGER CLAVE (STOCK AUTOMÁTICO)
-- ========================
CREATE TRIGGER descontar_stock
AFTER INSERT ON detalle_ventas
BEGIN
  UPDATE productos
  SET stock_actual = stock_actual - NEW.cantidad
  WHERE id = NEW.producto_id;
END;

-- ========================
-- SESIONES
-- ========================
CREATE TABLE sesiones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  expira_en TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ========================
-- CONFIGURACION
-- ========================
CREATE TABLE configuracion (
  clave TEXT PRIMARY KEY,
  valor TEXT,
  descripcion TEXT
);

-- ========================
-- SOLO ADMIN
-- ========================
INSERT INTO "usuarios" ("id","nombre","email","password","rol","activo","ultimo_acceso","created_at","updated_at") VALUES
(1,'Administrador','admin@supermercado.com','$2a$10$kMK12TxQFo1FI3JBIOlk1O64fpLGDxy/ryvBZr4yHUsv75/FYLC7K','admin',1,NULL,'2026-03-25 14:27:01','2026-03-28 03:52:24'),

-- Reiniciar autoincrement
DELETE FROM sqlite_sequence;
INSERT INTO sqlite_sequence (name, seq) VALUES ('usuarios', 1);