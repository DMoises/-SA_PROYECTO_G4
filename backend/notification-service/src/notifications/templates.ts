// Plantillas de correo por tipo de evento. datos viene del payload
// almacenado en buzon_salida.
export interface CorreoRenderizado {
  subject: string;
  html: string;
}

function baseTemplate(title: string, body: string, buttonText?: string, buttonUrl?: string): string {
  const buttonHtml = buttonText && buttonUrl ? `
    <div style="text-align: center; margin-top: 35px; margin-bottom: 15px;">
      <a href="${buttonUrl}" style="background-color: #E50914; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 4px; font-size: 16px; font-weight: bold; display: inline-block;">${buttonText}</a>
    </div>
  ` : '';

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        margin: 0;
        padding: 0;
        background-color: #141414;
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        color: #ffffff;
        -webkit-font-smoothing: antialiased;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 40px 20px;
      }
      .header {
        text-align: center;
        padding-bottom: 30px;
      }
      .logo {
        color: #E50914;
        font-size: 36px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 2px;
        text-decoration: none;
      }
      .content {
        background-color: #222222;
        padding: 40px;
        border-radius: 8px;
        border-top: 4px solid #E50914;
      }
      h1 {
        margin-top: 0;
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 20px;
        color: #ffffff;
      }
      p {
        font-size: 16px;
        line-height: 1.6;
        color: #cccccc;
        margin-bottom: 20px;
      }
      .footer {
        text-align: center;
        padding-top: 30px;
        font-size: 13px;
        color: #777777;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <span class="logo">QUETXAL TV</span>
      </div>
      <div class="content">
        <h1>${title}</h1>
        ${body}
        ${buttonHtml}
      </div>
      <div class="footer">
        <p>¿Preguntas? Visita nuestro Centro de ayuda en línea.</p>
        <p>© ${new Date().getFullYear()} Quetxal TV. Todos los derechos reservados.</p>
      </div>
    </div>
  </body>
  </html>
  `;
}

export function renderPlantilla(
  tipo: string,
  datos: Record<string, string>,
): CorreoRenderizado {
  switch (tipo) {
    case 'registro':
      return {
        subject: 'Bienvenido a Quetxal TV',
        html: baseTemplate(
          `Hola, ${datos.nombre || 'Administrador'}.`,
          `<p>Tu cuenta fue creada con éxito. Ya eres parte de Quetxal TV y puedes empezar a disfrutar de la mejor selección de películas y series sin interrupciones.</p>
           <p>Estamos muy emocionados de tenerte con nosotros.</p>`,
          'Empezar a ver',
          'http://localhost:3000'
        ),
      };
    case 'recibo':
      return {
        subject: 'Tu recibo de Quetxal TV',
        html: baseTemplate(
          'Gracias por tu compra',
          `<p>Este correo confirma que hemos recibido tu pago correctamente.</p>
           <div style="background-color: #141414; padding: 20px; border-radius: 6px; margin: 25px 0; border-left: 4px solid #E50914;">
             <p style="margin: 0; color: #fff;"><strong>Plan contratado:</strong> ${datos.plan || 'Suscripción'}</p>
             <p style="margin: 10px 0 0 0; color: #fff; font-size: 20px;"><strong>Total:</strong> ${datos.monto || '0.00'} ${datos.moneda || 'USD'}</p>
           </div>
           <p>Tu suscripción está activa. Prepárate para disfrutar del mejor contenido.</p>`,
          'Ver mi cuenta',
          'http://localhost:3000/profiles'
        ),
      };
    case 'nuevo_contenido':
      return {
        subject: `Nuevo lanzamiento: ${datos.titulo || 'Contenido'}`,
        html: baseTemplate(
          '¡Acabamos de agregar algo nuevo!',
          `<p>El contenido <strong>${datos.titulo || ''}</strong> ya está disponible en nuestra plataforma.</p>
           <p>No te lo pierdas. Agrégalo a tu lista y comienza a verlo cuando quieras en la mejor calidad.</p>`,
          'Ver ahora',
          'http://localhost:3000'
        ),
      };
    default:
      return {
        subject: 'Notificación de Quetxal TV',
        html: baseTemplate(
          'Tienes una nueva notificación',
          '<p>Ingresa a tu cuenta para ver más detalles sobre esta actualización.</p>',
          'Ir a Quetxal TV',
          'http://localhost:3000'
        ),
      };
  }
}