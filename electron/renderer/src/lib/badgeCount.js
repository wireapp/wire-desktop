export default function(title) {
  const matches = (/\(([0-9]+)\)/).exec(title)

  if (matches !== null) {
    return parseInt(counter[1], 10)
  }
  return undefined
}
