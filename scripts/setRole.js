/**
 * Uso: node scripts/setRole.js <email> <rol>
 * Roles válidos: admin, superAdmin
 *
 * Requiere serviceAccountKey.json en scripts/ (descargar desde Firebase Console
 * → Configuración del proyecto → Cuentas de servicio → Generar nueva clave privada)
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

const VALID_ROLES = ['admin', 'superAdmin'];

const [email, role] = process.argv.slice(2);

if (!email || !role) {
  console.error('Uso: node scripts/setRole.js <email> <rol>');
  console.error('Roles válidos:', VALID_ROLES.join(', '));
  process.exit(1);
}

if (!VALID_ROLES.includes(role)) {
  console.error(`Rol inválido: "${role}". Usá uno de: ${VALID_ROLES.join(', ')}`);
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

async function run() {
  const user = await admin.auth().getUserByEmail(email);
  await admin.auth().setCustomUserClaims(user.uid, { role });
  console.log(`✓ Rol '${role}' asignado a ${email} (uid: ${user.uid})`);
  console.log('  El usuario debe cerrar sesión y volver a entrar para que el cambio tome efecto.');
}

run().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
