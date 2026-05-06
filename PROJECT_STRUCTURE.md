# 📚 SchoolHub - Sistema de Gestión Educativa

## 📋 Estructura del Proyecto

```
src/
├── assets/           # Imágenes, iconos y otros recursos estáticos
├── components/       # Componentes React reutilizables
│   ├── common/      # Componentes básicos (Button, Input, etc)
│   ├── dashboard/   # Componentes para dashboards
│   └── forms/       # Formularios específicos
├── context/         # Context API para estado global
│   └── AuthContext.tsx
├── hooks/           # Custom React hooks
│   └── useAuth.ts
├── layouts/         # Layouts compartidos
│   └── MainLayout.tsx
├── pages/           # Páginas por rol
│   ├── auth/        # Páginas de autenticación
│   ├── director/    # Dashboard del director
│   ├── coordinator/ # Dashboard del coordinador
│   ├── teacher/     # Dashboard del profesor
│   └── student/     # Dashboard del estudiante
├── services/        # Servicios (Supabase, APIs, etc)
│   └── supabase.ts
├── types/           # Tipos TypeScript
│   └── index.ts
├── utils/           # Funciones utilitarias
│   └── constants.ts
├── App.tsx          # Componente principal
├── main.tsx         # Punto de entrada
└── index.css        # Estilos globales
```

## 🎨 Paleta de Colores

Los colores están definidos en `tailwind.config.js`:

- **Primarios**:
  - `primary`: #2563EB (Azul)
  - `primaryDark`: #1E40AF (Azul oscuro)
- **Secundarios**:
  - `secondary`: #38BDF8 (Cian)
- **Estados**:
  - `success`: #22C55E (Verde)
  - `error`: #EF4444 (Rojo)
  - `warning`: #F59E0B (Naranja)
- **Fondos**:
  - `background`: #FFFFFF (Blanco)
  - `surface`: #F1F5F9 (Gris claro)
- **Textos**:
  - `textPrimary`: #1E293B (Negro azulado)
  - `textSecondary`: #64748B (Gris)

## 🔐 Roles del Sistema

1. **👑 Director**: Rol de consulta. Ve resumen general, métricas e información académica, sin edición.
2. **🧑‍💼 Coordinador**: Crea profesores, crea cursos, crea estudiantes dentro de un curso, asigna profesores a cursos y consulta todas las notas con detalle.
3. **👨‍🏫 Profesor**: Registra notas únicamente en los cursos que le fueron asignados.
4. **👨‍🎓 Estudiante**: Visualiza únicamente sus propias notas.

## 🏫 Modelo del Dominio Escolar

- `Course`: Curso académico
- `StudentCourseEnrollment`: Relación estudiante-curso
- `TeacherCourseAssignment`: Relación profesor-curso
- `GradeRecord`: Nota registrada para un estudiante en un curso por un profesor

### Reglas funcionales clave

- El proyecto es un sistema de gestión para una escuela.
- Los estudiantes se crean dentro de un curso.
- Un profesor no puede calificar cursos ajenos.
- El coordinador puede ver las notas de todos los estudiantes.
- El director tiene vista general y de supervisión.
- El estudiante solo consulta sus propias notas.

## 🚀 Tipos Principales

Definidos en `src/types/index.ts`:

- `User`: Usuario del sistema
- `UserRole`: Enum de roles
- `Course`: Curso académico
- `Subject`: Materia dentro de un curso
- `Enrollment`: Inscripción de estudiante en curso
- `TeacherAssignment`: Asignación de profesor a curso
- `Grade`: Calificación del estudiante

## 📦 Servicios Supabase

Definidos en `src/services/supabase.ts`:

- `authService`: Autenticación
- `userService`: Gestión de usuarios
- `courseService`: Gestión de cursos
- `gradeService`: Gestión de calificaciones

## ⚙️ Configuración de Supabase

Necesitas crear las siguientes variables de entorno en `.env.local`:

```
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

## 🎯 Próximos Pasos

1. Configurar Supabase y crear las tablas
2. Implementar las páginas de login
3. Crear los dashboards por rol
4. Implementar la lógica de protección de rutas
5. Agregar componentes específicos según sea necesario
