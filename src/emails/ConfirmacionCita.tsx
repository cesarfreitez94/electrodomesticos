import { Html, Head, Body, Container, Heading, Text, Hr, Section } from '@react-email/components'

interface Props {
  clienteNombre: string
  servicioNombre: string
  fecha: string
  hora: string
  direccion: string
  ciudad: string
  tecnicoNombre?: string
}

export function ConfirmacionCita({
  clienteNombre,
  servicioNombre,
  fecha,
  hora,
  direccion,
  ciudad,
  tecnicoNombre,
}: Props) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f9fafb' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}>
          <Heading as="h1" style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>
            Confirmación de tu cita
          </Heading>

          <Text style={{ fontSize: '16px', color: '#374151', lineHeight: '24px' }}>
            Hola {clienteNombre},
          </Text>

          <Text style={{ fontSize: '16px', color: '#374151', lineHeight: '24px' }}>
            Tu cita ha sido <strong>confirmada</strong>. Aquí están los detalles:
          </Text>

          <Section style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '8px', marginTop: '24px', border: '1px solid #e5e7eb' }}>
            <Text style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Servicio</Text>
            <Text style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>{servicioNombre}</Text>

            <Text style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Fecha y hora</Text>
            <Text style={{ fontSize: '16px', color: '#111827', marginBottom: '16px' }}>{fecha} a las {hora}</Text>

            <Text style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Dirección</Text>
            <Text style={{ fontSize: '16px', color: '#111827', marginBottom: '16px' }}>{direccion}, {ciudad}</Text>

            {tecnicoNombre && (
              <>
                <Text style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Técnico asignado</Text>
                <Text style={{ fontSize: '16px', color: '#111827' }}>{tecnicoNombre}</Text>
              </>
            )}
          </Section>

          <Hr style={{ margin: '32px 0', borderColor: '#e5e7eb' }} />

          <Text style={{ fontSize: '14px', color: '#6b7280' }}>
            Si necesitas reprogramar o cancelar, contacta a nuestro equipo.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}