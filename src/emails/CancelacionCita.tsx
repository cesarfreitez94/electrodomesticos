import { Html, Head, Body, Container, Heading, Text, Section } from '@react-email/components'

interface Props {
  clienteNombre: string
  servicioNombre: string
  fecha: string
  hora: string
}

export function CancelacionCita({
  clienteNombre,
  servicioNombre,
  fecha,
  hora,
}: Props) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f9fafb' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}>
          <Heading as="h1" style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>
            Cancelación de tu cita
          </Heading>

          <Text style={{ fontSize: '16px', color: '#374151', lineHeight: '24px' }}>
            Hola {clienteNombre},
          </Text>

          <Text style={{ fontSize: '16px', color: '#374151', lineHeight: '24px' }}>
            Lamentamos informarte que tu cita ha sido <strong>cancelada</strong>:
          </Text>

          <Section style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '8px', marginTop: '24px', border: '1px solid #e5e7eb' }}>
            <Text style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Servicio</Text>
            <Text style={{ fontSize: '16px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>{servicioNombre}</Text>

            <Text style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Fecha y hora</Text>
            <Text style={{ fontSize: '16px', color: '#111827' }}>{fecha} a las {hora}</Text>
          </Section>

          <Text style={{ fontSize: '14px', color: '#6b7280', marginTop: '24px' }}>
            Puedes agendar una nueva cita desde nuestro sitio web cuando lo prefieras.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}