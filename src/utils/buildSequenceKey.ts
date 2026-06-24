type BuildSequenceKeyInput = {
  mode: "DAILY" | "CONTINUOUS"
  date?: Date
}

function buildBrazilDateKey(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })

  const parts = formatter.formatToParts(date)
  const year = parts.find((part) => part.type === "year")?.value
  const month = parts.find((part) => part.type === "month")?.value
  const day = parts.find((part) => part.type === "day")?.value

  if (!year || !month || !day) {
    throw new Error("Unable to build sequence key")
  }

  return `${year}-${month}-${day}`
}

export function buildSequenceKey({ mode, date = new Date() }: BuildSequenceKeyInput) {
  if (mode === "DAILY") {
    return buildBrazilDateKey(date)
  }

  if (mode === "CONTINUOUS") {
    return "global"
  }

  throw new Error("Invalid sequence mode")
}
