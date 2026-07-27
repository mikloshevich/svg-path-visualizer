const cnv = document.getElementById('cnv')
const ctx = cnv.getContext('2d')
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

cnv.width = 500
cnv.height = cnv.width

const cnvCenter = {
    x: cnv.width*0.5,
    y: cnv.height*0.3,
}

const slider = document.getElementById('amplitude')
slider.value = 1

let amplitudeBoost = 1
slider.addEventListener('input', (e) => {
    document.querySelector('.ampl-times').innerText = e.target.value
    amplitudeBoost = e.target.value
})

const sizeScale = 0.8

const points = getPoints(svgEl)

let lastTime = 0
function animate() {
    const currentTime = window.performance.now()
    let dt = (currentTime - lastTime) * 0.001
    if (dt > 0.1) {
        dt = 0.1
    }

    // ctx.clearRect(0, 0, cnv.width, cnv.height)
    ctx.fillStyle = `hsla(0deg, 0%, 0%, 0.1)`
    ctx.fillRect(0, 0, cnv.width, cnv.height)

    // for (let i = 0; i < points.length; i++) {
    //     const x = points[i].pos.x
    //     const y = points[i].pos.y
    //     drawPointOnCanvas(x, y)
    // }


    const dataArray = sound.getWaveFloatData()
    // const smoothDataArray = sound.getSmoothFloatData(dataArray, dt, 2)

    // drawHorizontalWave(dataArray)

    ctx.save()

    ctx.globalCompositeOperation = 'lighter'
    ctx.filter = 'blur(2px)'

    drawPathWave(points, dataArray, strokeColor=`hsl(0deg, 100%, 50%)`, offset=0)
    drawPathWave(points, dataArray, strokeColor=`hsl(120deg, 100%, 50%)`, offset=(Math.PI/180)*15)
    drawPathWave(points, dataArray, strokeColor=`hsl(240deg, 100%, 50%)`, offset=(Math.PI/180)*30)

    ctx.filter = 'none'

    drawPathWave(points, dataArray, strokeColor=`hsl(0deg, 100%, 50%)`, offset=0,lineWidth=2)
    drawPathWave(points, dataArray, strokeColor=`hsl(120deg, 100%, 50%)`, offset=(Math.PI/180)*15,lineWidth=2)
    drawPathWave(points, dataArray, strokeColor=`hsl(240deg, 100%, 50%)`, offset=(Math.PI/180)*30,lineWidth=2)

    ctx.restore()

    lastTime = currentTime

    requestAnimationFrame(animate)
}
animate()

function drawPathWave(points, dataArray, strokeColor=`hsl(0deg, 0%, 100%)`, offset=1, lineWidth=1, power=20, isFill=false) {
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

function drawHorizontalWave(dataArray) {
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

function getPoints(svg) {
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

function drawPointOnCanvas(x, y, radius=5, color='#fff') {
    ctx.beginPath()
    ctx.arc(x,y, radius, 0, Math.PI*2)
    ctx.fillStyle = color
    ctx.fill()
}