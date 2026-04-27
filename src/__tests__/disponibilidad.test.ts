describe('calcularSlotsDisponibles — lógica de franja', () => {
  it('genera slots de 1 hora dentro de la franja', () => {
    const _franja = { horaInicio: '09:00', horaFin: '13:00' }
    const slots: string[] = []

    let hour = 9
    let minute = 0
    while (hour < 13 || (hour === 13 && minute < 0)) {
      if (hour < 13) {
        slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`)
      }
      minute += 60
      if (minute >= 60) {
        hour += Math.floor(minute / 60)
        minute = minute % 60
      }
    }

    expect(slots).toEqual(['09:00', '10:00', '11:00', '12:00'])
  })

  it('franja que empieza en hora y media', () => {
    const _franja = { horaInicio: '09:30', horaFin: '13:30' }
    const slots: string[] = []

    let hour = 9
    let minute = 30
    while (hour < 13 || (hour === 13 && minute < 30)) {
      if (hour < 13 || (hour === 13 && minute < 30)) {
        slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`)
      }
      minute += 60
      if (minute >= 60) {
        hour += Math.floor(minute / 60)
        minute = minute % 60
      }
    }

    expect(slots).toEqual(['09:30', '10:30', '11:30', '12:30'])
  })
})