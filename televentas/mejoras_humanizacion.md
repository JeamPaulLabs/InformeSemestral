# Mejoras para reducir apariencia "IA" en el informe

> Propuestas visuales y textuales para que el informe se perciba
> como hecho por un humano, no por una plantilla automatizada.
> Ningún cambio aplicado sin aprobación.

---

## 1. Texto y redacción

### Observaciones ejecutivas
- **Problema**: Estructura muy rígida: `[Nombre]: [dato] [dato] [dato].` Siempre misma fórmula.
- **Propuesta**: Redacción más conversacional:
  - "Nos quedamos 655 pólizas por debajo de la meta del semestre, equivalente al 4 %."
  - "Cerramos el semestre con 13.917 pólizas liquidadas, impulsados por Cuota Protegida."
  - "El equipo creció de 15 a 21 asesores, y el 37 % de las ventas viene del top 5."

### Nombres de tarjetas y títulos
- **Problema**: "Pólizas liquidadas · Semestre completo" suena a label de dashboard.
- **Propuesta**: Títulos más cortos y con tono:
  - "Pólizas al cierre" / "Resultado semestral"
  - "Crecimiento del equipo" / "Evolución asesores"

### Notas al pie (kpi-sub)
- **Problema**: "Cifra oficial liquidación ene–jun" parece nota de auditoría.
- **Propuesta**: "Corte a junio" / "Dato consolidado con Martha"

---

## 2. Visual y layout

### Tarjetas KPI
- **Problema**: Borde izquierdo de color exacto + sombra + padding idéntico = template.
- **Propuesta**: Variar:
  - Una tarjeta destacada más ancha (hero) y las otras dos compactas
  - Sin borde izquierdo, usar fondo ligeramente distinto
  - Alternar animaciones: no todas con `kpiPop` secuencial

### Paneles (`.panel`)
- **Problema**: Todos con `border-radius:16px`, `box-shadow`, fondo blanco.
- **Propuesta**: 
  - Panel principal sin sombra, solo separación por color de fondo
  - Alternar paneles con borde superior delgado de color en vez de sombra
  - Algunos paneles sin borde redondeado (rectos) para romper monotonía

### Gráficas SVG
- **Problema**: Curvas perfectas, área sombreada con gradiente, puntos exactos = generado.
- **Propuesta**:
  - Simplificar: solo línea punteada sin área, sin puntos
  - O solo barras simples sin gradiente
  - Etiquetas de datos menos prominentes

### Iconos Lucide
- **Problema**: Iconos de interfaz estándar (bar-chart-3, trophy, alert-triangle).
- **Propuesta**: 
  - Usar emojis en vez de SVG para observaciones: 📉📈🏆⚠️
  - O eliminar iconos decorativos y dejar solo texto

---

## 3. Datos y alertas

### Alertas (`.alert-info`, `.alert-warn`)
- **Problema**: Siempre con icono + texto en negritas + estructura binaria.
- **Propuesta**:
  - Sin icono, solo texto
  - Alternar entre alerta con fondo de color vs sin fondo (solo texto)
  - Texto completo (no fragmentado con <strong>)

### Tablas
- **Problema**: Header azul `#120180`, filas blancas, bordes grises exactos.
- **Propuesta**:
  - Quitar bordes verticales internos, dejar solo horizontales
  - Header con fondo más sutil (azul con opacidad)
  - Filas alternadas sin color (solo blanco)

---

## 4. Navegación y transiciones

### Animaciones
- **Problema**: `kpiPop`, `panelIn` secuenciales y predecibles.
- **Propuesta**:
  - Sin animación en algunos slides
  - Animación más rápida (0.25s en vez de 0.5s)
  - Solo fade, sin desplazamiento vertical

### Deep-links y tabs
- **Problema**: Tabs Vanti/Xuma con animación idéntica.
- **Propuesta**: Transición instantánea sin fade al cambiar de tab

---

## 5. Pendiente de revisar juntos

- ¿Dejamos los iconos Lucide o los cambiamos por emojis?
- ¿Unificamos el GAAP para ambos tabs o corregimos Vanti?
- ¿Reducimos animaciones o las dejamos todas?
- ¿Hacemos una versión "borrador" con algunos cambios para que Orlando compare?
