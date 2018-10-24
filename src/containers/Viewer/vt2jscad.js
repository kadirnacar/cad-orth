// positions, triangles, normals and colors
function vt2jscad (positions, triangles, normals, colors) {
  let src = ''
  src += '{\n  points: [\n    '
  for (let i = 0, j = 0; i < positions.length; i++) {
    if (j++) src += ',\n    '
    src += '[' + positions[i].join(", ") + ']' // .join(", ");
  }
  src += '],\n  polygons: [\n    '
  for (let i = 0, j = 0; i < triangles.length; i++) {
    if (j++) src += ',\n    '
    src += '[' + triangles[i].join(", ") + ']' // .join(', ');
  }
  if (colors && triangles.length === colors.length) {
    src += '],\n\tcolors: [\n    '
    for (let i = 0, j = 0; i < colors.length; i++) {
      if (j++) src += ',\n    '
      src += '[' + colors[i] + ']' // .join(', ');
    }
  }
  src += ']\n}'
  return src
}

module.exports = {
  vt2jscad
}
