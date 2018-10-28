// positions, triangles, normals and colors
function vt2jscad (positions, triangles, normals, colors) {
  let src = ''
  src += '{ points: ['
  for (let i = 0, j = 0; i < positions.length; i++) {
    if (j++) src += ', '
    src += '[' + positions[i].join(", ") + ']' // .join(", ");
  }
  src += '], polygons: ['
  for (let i = 0, j = 0; i < triangles.length; i++) {
    if (j++) src += ', '
    src += '[' + triangles[i].join(", ") + ']' // .join(', ');
  }
  if (colors && triangles.length === colors.length) {
    src += '],\tcolors: ['
    for (let i = 0, j = 0; i < colors.length; i++) {
      if (j++) src += ', '
      src += '[' + colors[i] + ']' // .join(', ');
    }
  }
  src += ']}'
  return src
}

module.exports = {
  vt2jscad
}
