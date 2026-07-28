class Sound {
    constructor() {
        this.intialized = false
        this.fftSize = Math.pow(2, 8)

        this.dataIntArray = new Uint8Array(this.fftSize)
        this.dataFloatArray = new Float32Array(this.fftSize)

        this.smoothDataArray = new Uint8Array(this.fftSize)
        this.smoothDataFloatArray = new Float32Array(this.fftSize)

        this.audioCtx = null
        this.audioSource = null
        this.analyser = null
    }

    getSmoothFloatData(array, dt, speed) {
        for (let i = 0; i < array.length; i++) {
            this.smoothDataFloatArray[i] += (this.dataFloatArray[i] - this.smoothDataFloatArray[i]) * dt * speed
        }
        return this.smoothDataFloatArray
    }

    getFreqIntData() {
        if (!this.analyser) {
            return []
        }
        this.analyser.getByteFrequencyData(this.dataIntArray)
        return this.dataIntArray
    }

    getFreqFloatData() {
        if (!this.analyser) {
            return []
        }
        this.analyser.getFloatFrequencyData(this.dataFloatArray)
        return this.dataFloatArray
    }

    getWaveIntData() {
        if (!this.analyser) {
            return []
        }
        this.analyser.getByteTimeDomainData(this.dataIntArray)
        return this.dataIntArray
    }

    getWaveFloatData() {
        if (!this.analyser) {
            return []
        }
        this.analyser.getFloatTimeDomainData(this.dataFloatArray)
        return this.dataFloatArray
    }

    createAnalizer(source) {
        if (!this.audioCtx) {
            this.audioCtx = new AudioContext()
        }

        if (!this.analyser) {
            this.analyser = new AnalyserNode(this.audioCtx, {
                fftSize: this.fftSize,
                smoothingTimeConstant: 0,
            })
        } else {
            this.analyser.disconnect(this.audioCtx.destination)
        }

        if (!this.audioSource) {
            this.audioSource = this.audioCtx.createMediaElementSource(source)
        } else if (this.analyser) {
            this.audioSource.disconnect(this.analyser)
        }

        this.audioSource.connect(this.analyser)
        this.analyser.connect(this.audioCtx.destination)
        this.bufferLength = this.analyser.frequencyBinCount
        this.intialized = true
        // console.log(this.bufferLength)
    }
}