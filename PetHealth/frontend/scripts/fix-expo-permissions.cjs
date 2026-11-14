const fs = require('fs');
const path = require('path');

// Expo SDK 51 needs this small compatibility fix when compiling with Android API 36.
const permissionsFile = path.join(
  __dirname,
  '..',
  'node_modules',
  'expo-modules-core',
  'android',
  'src',
  'main',
  'java',
  'expo',
  'modules',
  'adapters',
  'react',
  'permissions',
  'PermissionsService.kt',
);

const original = 'return requestedPermissions.contains(permission)';
const replacement = 'return requestedPermissions?.contains(permission) == true';

if (!fs.existsSync(permissionsFile)) {
  process.exit(0);
}

const source = fs.readFileSync(permissionsFile, 'utf8');
if (source.includes(original)) {
  fs.writeFileSync(permissionsFile, source.replace(original, replacement));
  console.log('Applied the Android API 36 permissions compatibility fix.');
}
