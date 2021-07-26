const crypto = require('crypto');

function createGuid() {
  return 'xxxxxxxx-xxxx-4xxx-axxx-xxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 3 | 8);
    return v.toString(16);
  });
}

function seoulTimezone(time) {
  return new Date(new Date(time).getTime() + (9 * 60 * 60000));
}

function jsonNullRemove(obj) {
  for (var key in obj) {
    if ([null, undefined, ''].includes(obj[key])) delete obj[key];
  }
  return obj;
}

function json_all_change(obj) {
  if (typeof obj === 'object') {
    for (let key in obj) {
      if (typeof obj[key] === 'object') obj[key] = json_all_change(obj[key]);
      if (typeof obj[key] === 'number') obj[key] = String(obj[key]);
    }
  }
  return obj;
}

function encrypt(text, salt_key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(salt_key), iv);
  const encrypted = cipher.update(text);

  return iv.toString('hex') + ':' + Buffer.concat([encrypted, cipher.final()]).toString('hex');
}

function decrypt(text, salt_key) {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(salt_key), iv);
  const decrypted = decipher.update(encryptedText);

  return Buffer.concat([decrypted, decipher.final()]).toString();
}


function find_project(array, key) {
  let result;
  array.some(x => {
    if (decrypt(key, x.salt_key) === x.push_id) {
      return result = x.id;
    }
  });
  return result;
}

module.exports = {
  createGuid,
  seoulTimezone,
  jsonNullRemove,
  json_all_change,
  encrypt,
  decrypt,
  find_project
};