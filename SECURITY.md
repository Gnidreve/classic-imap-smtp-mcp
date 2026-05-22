# Security Policy

## Reporting
Sicherheitsluecken bitte **nicht** als oeffentliches Issue, sondern via GitHub Security Advisory (oder Kontakt im Repo). Wir reagieren so schnell wie moeglich.

## Hinweise
- Credentials liegen im Klartext in der Config-Datei (Permission 0600 wird geprueft). Empfehlung: App-Passwords.
- Alle Verbindungen via TLS (implicit oder STARTTLS). `verify_tls=false` nur fuer vertrauenswuerdige interne Server.
- Credentials werden niemals geloggt (Sanitizer).
