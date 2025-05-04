# 📱 Aplicación de mensajería instantánea
Una aplicación de mensajería instantánea donde puedes enviar y leer mensajes tanto si estás logado como si no, dependiendo de los chats a los que accedas.

# 🚀 Características
- 💬 **Mensajería en tiempo real** gracias a WebSockets.
- 🚫 **Filtro de mensajes tóxicos** con la API de Perspective.
- 🔒 **Control de privacidad de chats:** públicos (acceso libre) y privados (solo participantes).

## 🛠 Tecnologías utilizadas
- **Front-end**: Next.js, Tailwind CSS.
- **Backend**: Node.js, Express, Prisma.  
- **Base de datos**: PostgreSQL.
- **Autenticación**: NextAuth.
- **Encriptado de contraseñas**: bcrypt.
- **Filtro de contenido**: Perspective API.
- **Control de versiones**: GIT y GitHub.


## 📋 Funcionalidades pendientes
- 🔐 **Autenticación** en los endpoints aplicando NextAuth.
- 🔐 **Signup y login** en el front que consuman los endpoints de autenticación.
- 🛎 **Notificaciones** usando una tabla específica en la base de datos.
- 📱 **Diseño responsivo**, adaptable a móviles y tablets.

## 📗 Pasos a seguir para iniciar/configurar el proyecto

**1- Clona el repositorio**

    git clone https://github.com/unduashe/minstant.git
    cd minstant

**2- Instala las dependencias necesarias si no las tienes**
    
    npm install

Instala estas librerías si no las tienes:

    npm install express                                                           # servidor de WebSockets
    npm install --save-dev tsx                                                    # ejecutar TypeScript en Node
    npm install next-auth @next-auth/prisma-adapter bcryptjs @types/bcryptjs      # Autenticación y encriptado
    npm install zod                                                               # validación de esquemas
    

**3- Crea el archivo .env en la raíz del proyecto con las siguientes variables**:

    NEXTAUTH_SECRET="tu_clave_secreta"
    NEXTAUTH_URL="http://localhost:3000"
    NEXTJS_API_URL="http://localhost:3000"
    API_KEY_PERSPECTIVE="tu_api_key_perspective"
    DATABASE_URL="postgres://usuario:contraseña@localhost:5432/tu_bd"

**4- Crea la base de datos y realiza las migraciones**

  1. Instala tu motor de base de datos (por ejemplo PostgreSQL).
  2. Asegúrate de que la variable `DATABASE_URL` apunte a tu BD.
  3. Ejecuta:

    npx prisma migrate dev --name init

**5- Lanza el proyecto**

En dos terminales diferentes:

    npm run dev:next    # front-end (Next.js)
    npm run dev         # servidor de WebSockets

🎉 ¡¡Ya tienes el proyecto funcionando, ya puedes enviar y recibir mensajes de forma instantánea!!
