const cnvWrapper = document.querySelector('.cnv-wrapper')
// cnvWrapper.style.mixBlendMode = 'screen'

const cnv2 = document.createElement('canvas')
const ctx2 = cnv2.getContext('2d')
cnv2.style.backgroundColor = '#000'
cnv2.style.position = 'absolute'
cnv2.style.top = 0
cnv2.style.left = 0
cnv2.style.width = '100%'

cnv2.style.mixBlendMode = 'screen'

cnvWrapper.appendChild(cnv2)


const cnv1 = document.getElementById('cnv')
const ctx1 = cnv.getContext('2d')
const svgEl = document.querySelector('.reference')

const dropZone = document.querySelector('.upload-label')
const fileInput = dropZone.querySelector('#upload')
const fileName = dropZone.querySelector('.file-name')
const audioEl = document.querySelector('[data-audio]')

const sound = new Sound()

;['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => e.preventDefault(), false)
})

dropZone.addEventListener('dragover', () => dropZone.classList.add('drag-over'))
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'))

dropZone.addEventListener('drop', (e) => {
    if (e.dataTransfer.files.length > 0) {
        processFile(e.dataTransfer.files)
    }
})

fileInput.addEventListener('change', (e) => {
    processFile(e.target.files)
})

cnv1.width = 500
cnv1.height = cnv1.width

cnv2.width = cnv1.width
cnv2.height = cnv1.height

const cnvCenter = {
    x: cnv1.width*0.5,
    y: cnv1.height*0.3,
}

const slider = document.getElementById('amplitude')
slider.value = 1

let amplitudeBoost = 1
slider.addEventListener('input', (e) => {
    document.querySelector('.ampl-times').innerText = e.target.value
    amplitudeBoost = e.target.value
})

const sizeScale = 0.8

const points = getPoints(svgEl, cnv1)

let lastTime = 0
function animate() {
    const currentTime = window.performance.now()
    let dt = (currentTime - lastTime) * 0.001
    if (dt > 0.1) {
        dt = 0.1
    }

    const dataArray = sound.getWaveFloatData()
    // const smoothDataArray = sound.getSmoothFloatData(dataArray, dt, 2)

    // ctx1.clearRect(0, 0, cnv1.width, cnv1.height)
    ctx1.fillStyle = `hsla(0deg, 0%, 0%, 0.15)`
    ctx1.fillRect(0, 0, cnv1.width, cnv1.height)

    // ctx2.clearRect(0, 0, cnv1.width, cnv1.height)
    ctx2.fillStyle = `hsla(0deg, 0%, 0%, 0.4)`
    ctx2.fillRect(0, 0, cnv1.width, cnv1.height)

    // for (let i = 0; i < points.length; i++) {
    //     const x = points[i].pos.x
    //     const y = points[i].pos.y
    //     drawPointOnCanvas(ctx2, x, y)
    // }

    // drawHorizontalWave(ctx2, dataArray)

    ctx1.save()
    ctx1.globalCompositeOperation = 'lighter'
    // ctx1.filter = 'blur(2px) contrast(3) saturate(3) brightness(3)' // contrast(2) saturate(1.5) brightness(10)

    drawPathWave(ctx1, points, dataArray, {strokeColor:`hsl(0deg, 100%, 50%)`, offset:0, lineWidth:4})
    drawPathWave(ctx1, points, dataArray, {strokeColor:`hsl(120deg, 100%, 50%)`, offset:(Math.PI/180)*15,lineWidth:4})
    drawPathWave(ctx1, points, dataArray, {strokeColor:`hsl(240deg, 100%, 50%)`, offset:(Math.PI/180)*30,lineWidth:4})

    ctx1.restore()

    ctx2.save()
    ctx2.globalCompositeOperation = 'lighter'

    drawPathWave(ctx2, points, dataArray, {power: 30,strokeColor:`hsl(0deg, 100%, 50%)`, offset:0,lineWidth:4})
    drawPathWave(ctx2, points, dataArray, {power: 30,strokeColor:`hsl(120deg, 100%, 50%)`, offset:(Math.PI/180)*15,lineWidth:4})
    drawPathWave(ctx2, points, dataArray, {power: 30,strokeColor:`hsl(240deg, 100%, 50%)`, offset:(Math.PI/180)*30,lineWidth:4})

    ctx2.restore()

    // drawPathWave(ctx2, points, dataArray, {strokeColor:`hsl(0deg, 100%, 0%)`, offset:0,lineWidth:4})

    lastTime = currentTime

    requestAnimationFrame(animate)
}
animate()

function drawPathWave(ctx, points, dataArray, {strokeColor=`hsl(0deg, 0%, 100%)`, offset=1, lineWidth=1, power=20, isFill=false} = {}) {
    for (let i = 0; i < points.length; i++) {
        const waveData = dataArray[(i)%(sound.fftSize)] || 0
        const x = points[i].pos.x + Math.cos(points[i].angleToCenter+offset) * waveData*power*amplitudeBoost
        const y = points[i].pos.y + Math.sin(points[i].angleToCenter+offset) * waveData*power*amplitudeBoost
        if (i === 0) {
            ctx.beginPath()
            ctx.moveTo(x, y)
        } else {
            ctx.lineTo(x, y)
        }
        if (i === points.length - 1) {
            // ctx.closePath()
            ctx.strokeStyle = strokeColor
            ctx.fillStyle = strokeColor
            ctx.lineWidth = lineWidth
            ctx.stroke()
            if (isFill) {
                ctx.fill()
            }
        }
    }
}

function drawHorizontalWave(ctx, dataArray) {
    const sliceWidth = cnv.width / sound.fftSize
    let x = 0
    ctx.beginPath()
    for (let i = 0; i < sound.fftSize; i++) {
        const waveData = dataArray[i] || 0
        const v = (waveData * 100 )|| 0
        const y = (cnv.height / 2) + v
        if (i === 0) {
            ctx.moveTo(x, y)
        } else {
            ctx.lineTo(x, y)
        }
        x += sliceWidth
    }
    ctx.strokeStyle = `hsl(0deg, 0%, 100%)`
    ctx.stroke()
}

function getPoints(svg, cnv) {
    const arr = []
    svg.style.display = 'block'
    const svgRect = svg.getBoundingClientRect()
    const ratio = (cnv.width / svgRect.width) * sizeScale
    const p = svg.querySelector('path')
    const segmentsAmount = 128
    const pathLen = p.getTotalLength()
    // const segmentLen = Math.max(1, Math.round(pathLen / segmentsAmount))
    const segmentLen = pathLen / segmentsAmount

    for (let i = 0; i <= pathLen; i+=segmentLen) {
        const pos = p.getPointAtLength(i)
        pos.x = (pos.x - svgRect.width*0.5)*ratio + cnv.width*0.5
        pos.y = (pos.y - svgRect.height*0.5)*ratio + cnv.height*0.5
        const angleToCenter = Math.atan2(pos.y - cnvCenter.y, pos.x - cnvCenter.x)
        arr.push({pos, angleToCenter})
    }
    svgEl.style.display = 'none'
    return arr
}

function processFile(files) {
    const file = files[0]
    if (!file) {
            fileName.innerText = 'No file, try again!'
    } else {
        fileName.innerText = file.name
        const fileURL = URL.createObjectURL(file)
        audioEl.src = fileURL
        sound.createAnalizer(audioEl)
    }
}

function drawPointOnCanvas(ctx, x, y, radius=3, color='#f55') {
    ctx.beginPath()
    ctx.arc(x,y, radius, 0, Math.PI*2)
    ctx.fillStyle = color
    ctx.fill()
}