import { calcularCargaTecnico } from '@/lib/asignacion-tecnico'

describe('asignarTecnico', () => {
  it('asigna al técnico con menor carga', () => {
    const tecnicos = [
      {
        id: 't1',
        createdAt: new Date('2024-01-01'),
        citasTecnico: [
          { fechaHora: new Date('2026-04-27T09:00:00'), estado: 'confirmado' },
        ],
      },
      {
        id: 't2',
        createdAt: new Date('2024-01-02'),
        citasTecnico: [],
      },
    ]

    const slotStart = new Date('2026-04-27T10:00:00')
    const slotEnd = new Date('2026-04-27T11:00:00')

    const result = calcularCargaTecnico(tecnicos, slotStart, slotEnd)
    expect(result.tecnicoId).toBe('t2')
    expect(result.count).toBe(0)
  })

  it('empate: elige el más antiguo', () => {
    const tecnicos = [
      {
        id: 't1',
        createdAt: new Date('2024-01-02'),
        citasTecnico: [{ fechaHora: new Date('2026-04-27T09:00:00'), estado: 'confirmado' }],
      },
      {
        id: 't2',
        createdAt: new Date('2024-01-01'),
        citasTecnico: [{ fechaHora: new Date('2026-04-27T09:00:00'), estado: 'confirmado' }],
      },
    ]

    const slotStart = new Date('2026-04-27T10:00:00')
    const slotEnd = new Date('2026-04-27T11:00:00')

    const result = calcularCargaTecnico(tecnicos, slotStart, slotEnd)
    expect(result.tecnicoId).toBe('t2')
  })

  it('todos con conflicto: retorna emergencia', () => {
    const tecnicos = [
      {
        id: 't1',
        createdAt: new Date('2024-01-01'),
        citasTecnico: [{ fechaHora: new Date('2026-04-27T10:00:00'), estado: 'confirmado' }],
      },
      {
        id: 't2',
        createdAt: new Date('2024-01-02'),
        citasTecnico: [{ fechaHora: new Date('2026-04-27T10:00:00'), estado: 'confirmado' }],
      },
    ]

    const slotStart = new Date('2026-04-27T10:00:00')
    const slotEnd = new Date('2026-04-27T11:00:00')

    const result = calcularCargaTecnico(tecnicos, slotStart, slotEnd)
    expect(result.tecnicoId).toBeNull()
  })

  it('slot que no se solapa con cita existente: disponible', () => {
    const tecnicos = [
      {
        id: 't1',
        createdAt: new Date('2024-01-01'),
        citasTecnico: [{ fechaHora: new Date('2026-04-27T09:00:00'), estado: 'confirmado' }],
      },
    ]

    const slotStart = new Date('2026-04-27T11:00:00')
    const slotEnd = new Date('2026-04-27T12:00:00')

    const result = calcularCargaTecnico(tecnicos, slotStart, slotEnd)
    expect(result.tecnicoId).toBe('t1')
    expect(result.count).toBe(0)
  })
})