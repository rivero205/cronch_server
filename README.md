# Cronch - Backend API

Servidor Node.js/Express que gestiona la lógica de negocio, integración con base de datos y reporting para la plataforma Cronch.

## 🏗️ Arquitectura

La aplicación sigue un patrón de diseño por capas:

- **Routes**: Define los endpoints de la API (`/routes`).
- **Middleware**: Validaciones y autenticación JWT delegada a Supabase (`/middleware`).
- **Services**: Contiene la lógica de negocio principal (`/services`).
- **Repositories**: Encapsula las consultas a la base de datos PostgreSQL/Supabase (`/repositories`).
- **DB Hook**: Conexión centralizada (`db.js`).

## 🛠️ Tecnologías

- **Node.js** & **Express**
- **PostgreSQL** (vía Supabase)
- **Cors** & **Dotenv**
- **Postgres.js** para consultas SQL directas.

## 🚀 Empezando

### Requisitos previos
- Node.js instalado.
- Una instancia de Supabase configurada.

### Instalación
```bash
cd server
npm install
```

### Configuración
Crea un archivo `.env` basado en las necesidades del proyecto:
```env
PORT=3000
SUPABASE_URL=tu_url
SUPABASE_KEY=tu_service_role_key
DATABASE_URL=tu_connection_string
```

### Ejecutar
```bash
npm start
```

## 🗄️ Base de Datos
El proyecto incluye múltiples scripts SQL en la raíz de `/server` para migraciones y configuración de políticas RLS (Row Level Security). El esquema principal se encuentra en `database_setup.sql`.

## 🔒 Seguridad
Toda la API está protegida mediante un middleware de autenticación que valida el token de Supabase. El sistema utiliza **RBAC** (Role Based Access Control) para distinguir entre:
- Super Admin
- Admin
- Editor/Vendedor
