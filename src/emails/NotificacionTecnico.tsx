import { Html, Head, Body, Container, Heading, Text, Section } from '@react-email/components'

interface Props {
  tecnicoNombre: string
  clienteNombre: string
  clienteTelefono: string
  servicioNombre: string
  fecha: string
  hora: string
  direccion: string
  ciudad: string
}

export function NotificacionTecnico({
  tecnicoNombre,
  clienteNombre,
  clienteTelefono,
  servicioNombre,
  fecha,
  hora,
  direccion,
  ciudad,
}: Props) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f9fafb' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}>
          <Heading as="h1" style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>
            Nueva cita asignada
          </Heading>

          <Text style={{ fontSize: '16px', color: '#374151', lineHeight: '24px' }}>
            Hola {tecnicoNombre},
          </Text>

          <Text style={{ fontSize: '16px', color: '#374151', lineHeight: '24px' }}>
            Se te ha asignado una nueva visita. Por favor revisa los detalles y confirma tu comprensión desde el portal técnico.
          </Text>

          <Section style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '8px', marginTop: '24px', border: '1px solid #e5e7eb' }}>
            <Text style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Cliente</Text>
            <Text style={{ fontSize: '16px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>{clienteNombre} — {clienteTelefono}</Text>

            <Text style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Servicio</Text>
            <Text style={{ fontSize: '16px', color: '#111827', marginBottom: '16px' }}>{servicioNombre}</Text>

            <Text style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Fecha y hora</Text>
            <Text style={{ fontSize: '16px', color: '#111827', marginBottom: '16px' }}>{fecha} a las {hora}</Text>

            <Text style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Dirección</Text>
            <Text style={{ fontSize: '16px', color: '#111827' }}>{direccion}, {ciudad}</Text>
          </Section>

          <Text style={{ fontSize: '14px', color: '#6b7280', marginTop: '24px' }}>
            Accede al portal técnico para confirmar esta cita.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}