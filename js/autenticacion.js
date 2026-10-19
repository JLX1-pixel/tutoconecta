// La autenticación es intencionalmente simulada y solo persiste en este navegador.
function currentUser(){return getStore('user',null)}
function requireRole(role){let user=currentUser();if(!user){location.href='login.html';return false}return user.role===role}
