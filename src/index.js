window.lcjsSmallView = window.devicePixelRatio >= 2
if (!window.__lcjsDebugOverlay) {
    window.__lcjsDebugOverlay = document.createElement('div')
    window.__lcjsDebugOverlay.style.cssText = 'position:fixed;top:10px;left:10px;background:rgba(0,0,0,0.7);color:#fff;padding:4px 8px;z-index:99999;font:12px monospace;pointer-events:none'
    const attach = () => { if (document.body && !window.__lcjsDebugOverlay.parentNode) document.body.appendChild(window.__lcjsDebugOverlay) }
    attach()
    setInterval(() => {
        attach()
        window.__lcjsDebugOverlay.textContent = window.innerWidth + 'x' + window.innerHeight + ' dpr=' + window.devicePixelRatio + ' small=' + window.lcjsSmallView
    }, 500)
}
const lcjs = require('@lightningchart/lcjs')
const {
    lightningChart,
    Themes,
    AxisScrollStrategies,
    LUT,
    regularColorSteps,
    PalettedFill,
    emptyLine,
    synchronizeAxisIntervals,
    AxisTickStrategies,
} = lcjs

// General configuration for this data set
const config = {
    framesPerSecond: 20,
    frameIntervalMs: (0.5 * 1000) / 20,
    freqStartMHz: 0,      
    freqEndMHz: 400,
    resolution: 1612,       
    freqStepMHz: (400 - 0) / (1612 - 1),
    visibleFrameCount: 400,
}
const charts = []

// Initialize LightningChart JS
const lc = lightningChart({
            resourcesBaseUrl: new URL(document.head.baseURI).origin + new URL(document.head.baseURI).pathname + 'resources/',
        })

const exampleContainer = document.getElementById('chart') || document.body
if (exampleContainer === document.body) {
    exampleContainer.style.width = '100vw'
    exampleContainer.style.height = '100vh'
    exampleContainer.style.margin = '0px'
}
exampleContainer.style.display = 'flex'
exampleContainer.style.flexDirection = 'column'

// Create chart with no aggregation
const containerChart1 = document.createElement('div')
exampleContainer.append(containerChart1)
const chart1 = lc
    .ChartXY({
        container: containerChart1,
        defaultAxisX: { type: 'linear-highPrecision' },
        defaultAxisY: { type: 'linear-highPrecision' },
        theme: (() => {
    const t = Themes[new URLSearchParams(window.location.search).get('theme') || 'darkGold'] || undefined
    return t && window.lcjsSmallView ? lcjs.scaleTheme(t, 0.5) : t
})(),
textRenderer: window.lcjsSmallView ? lcjs.htmlTextRenderer : undefined,
    })
    .setTitle('Scrolling Heatmap - No Aggregation')
    .setTitleMargin({ top: 10, bottom: 10 })
    .setCursorMode(undefined)
containerChart1.style.flex = '1'

// Setup progressive scrolling Axis
chart1.axisY
    .setScrollStrategy(AxisScrollStrategies.scrolling)
    .setTitle('Time (s)')
    .setDefaultInterval((state) => ({
        start: state.dataMax ?? 0,
        end: (state.dataMax ?? 0) - config.visibleFrameCount,
        stopAxisAfter: false,
    }))
    .setPointerEvents(false)
    // .setTickStrategy(AxisTickStrategies.Empty)
    .setTickStrategy(AxisTickStrategies.Numeric, (tickStrategy) => tickStrategy
        .setFormattingFunction((frameIndex) => {
            const seconds = frameIndex / config.framesPerSecond
            return seconds.toFixed(1) 
        })
    )
    .setAnimationsEnabled(false)

chart1.axisX
    .setTitle('Frequency')
    .setUnits('MHz')
    .setInterval({ start: config.freqStartMHz, end: config.freqEndMHz })
    .setPointerEvents(false)
    .setMarginAfterTicks(10)

const theme = chart1.getTheme()

// Create Scrolling Heatmap Grid Series
const heatmapSeries1 = chart1
    .addHeatmapScrollingGridSeries({
        scrollDimension: 'rows',
        resolution: config.resolution,
    })
    .setName('Power')
    .setStart({ x: config.freqStartMHz, y: 0 })
    .setStep({ x: config.freqStepMHz, y: 1 })
    .setWireframeStyle(emptyLine)
    // Configure automatic data cleaning.
    .setDataCleaning({
        // Out of view data can be lazily removed as long as total columns count remains over 1000.
        minDataPointCount: 1000,
    })

// Create chart with aggregation mode set to "max"
const containerChart2 = document.createElement('div')
exampleContainer.append(containerChart2)
const chart2 = lc
    .ChartXY({
        container: containerChart2,
        defaultAxisX: { type: 'linear-highPrecision' },
        defaultAxisY: { type: 'linear-highPrecision' },
        theme: (() => {
    const t = Themes[new URLSearchParams(window.location.search).get('theme') || 'darkGold'] || undefined
    return t && window.lcjsSmallView ? lcjs.scaleTheme(t, 0.5) : t
})(),
textRenderer: window.lcjsSmallView ? lcjs.htmlTextRenderer : undefined,
    })
    .setTitle('Scrolling Heatmap - Aggregation (Max)')
    .setTitleMargin({ top: 10, bottom: 10 })
    .setCursorMode(undefined)
containerChart2.style.flex = '1'

// Setup progressive scrolling Axis
chart2.axisY
    .setScrollStrategy(AxisScrollStrategies.scrolling)
    .setTitle('Time (s)')
    .setDefaultInterval((state) => ({
        start: state.dataMax ?? 0,
        end: (state.dataMax ?? 0) - config.visibleFrameCount,
        stopAxisAfter: false,
    }))
    .setPointerEvents(false)
    .setTickStrategy(AxisTickStrategies.Numeric, (tickStrategy) => tickStrategy
        .setFormattingFunction((frameIndex) => {
            const seconds = frameIndex / config.framesPerSecond
            return seconds.toFixed(1) 
        })
    )
    .setAnimationsEnabled(false)

chart2.axisX
    .setTitle('Frequency')
    .setUnits('MHz')
    .setInterval({ start: config.freqStartMHz, end: config.freqEndMHz })
    .setPointerEvents(false)
    .setMarginAfterTicks(10)

const heatmapSeries2 = chart2
    .addHeatmapScrollingGridSeries({
        scrollDimension: 'rows',
        resolution: config.resolution,
    })
    .setName('Power')
    .setStart({ x: config.freqStartMHz, y: 0 })
    .setStep({ x: config.freqStepMHz, y: 1 })
    .setWireframeStyle(emptyLine)
    .setAggregation('max')
    .setIntensityInterpolation('disabled')
    // Configure automatic data cleaning.
    .setDataCleaning({
        // Out of view data can be lazily removed as long as total columns count remains over 1000.
        minDataPointCount: 1000,
    })

// Synchronize the intervals of the x- and y-axes
synchronizeAxisIntervals(chart1.axisX, chart2.axisX)
synchronizeAxisIntervals(chart1.axisY, chart2.axisY)

// Add manual cursors to charts
const cursor1 = chart1.addCursor()
const cursor2 = chart2.addCursor()
charts.push({ chart: chart1, series: heatmapSeries1, cursor: cursor1 })
charts.push({ chart: chart2, series: heatmapSeries2, cursor: cursor2 })

const hideCursor = () => {
    charts.forEach((chart) => chart.cursor.setVisible(false))
}

// Display cursor at given x coordinate and solve nearest for all series in both charts
const displayCursorAt = (x, y, value) => {
    charts.forEach((chart) => {
        const solveResults = chart.chart
        .getSeries()    
        // NOTE: Heatmap series doesn't currently have direct API syntax to solve nearest from axis coordinate - for it, you have to first translate axis coordinate to client coordinate and then use solve nearest
        .map((series) => series.getCursorEnabled() && series.solveNearest({ x, y: 0 }))
        .filter((solve) => !!solve)
        if (solveResults.length > 0) {
            solveResults[0].x = x
            solveResults[0].y = y
            solveResults[0].cursorPosition.pointMarker.x = x
            solveResults[0].cursorPosition.pointMarker.y = y
            solveResults[0].intensity = value
            chart.cursor
            .setVisible(true)
            .setPosition({
                pointMarker: { x: x, y: y },
                pointMarkerScale: chart1.coordsAxis,
                resultTable: { x: x, y: y },
                resultTableScale: chart1.coordsAxis,
            })
            .setResultTable((rt) => rt.setContent(chart1.getCursorFormatting()(chart1, solveResults[0], solveResults)))
        } else {
            chart.cursor.setVisible(false)
        }
    })

}

charts.forEach((chart) => {
    chart.series.addEventListener('pointermove', (event, info) => {
        let intensity = 0        
        if (info) {
            try { intensity = info.intensity } catch (error) { intensity = 0} 
        }
        displayCursorAt(chart.chart.translateCoordinate(event, chart.chart.coordsAxis).x, chart.chart.translateCoordinate(event, chart.chart.coordsAxis).y, intensity)
    })
    chart.series.addEventListener('pointerleave', (event) => hideCursor())
})

const streamData = () => {
    fetch(document.head.baseURI + 'examples/assets/1708/spectrum.json')
        .then((r) => r.json())
        .then((data) => {
            // Find min and max values of data for LUT
            let min = data[0][0]
            let max = data[0][0]

            for (const frame of data) {
                for (const v of frame) {
                    if (v < min) min = v
                    if (v > max) max = v
                }
            }

            const lut = new LUT({
                interpolate: true,
                steps: regularColorSteps(Math.floor(min), Math.ceil(max), theme.examples.coldHotColorPalette),
                units: 'dBm',
            })
            const paletteFill = new PalettedFill({ lut, lookUpProperty: 'value' })
            heatmapSeries1.setFillStyle(paletteFill)
            heatmapSeries2.setFillStyle(paletteFill)

            let frameIndex = 0

            const interval = setInterval(() => {
                if (frameIndex >= data.length) frameIndex = 0

                const sample = data[frameIndex]
                heatmapSeries1.addIntensityValues([sample])
                heatmapSeries2.addIntensityValues([sample])

                frameIndex++
            }, config.frameIntervalMs)
        })
        .catch((err) => {
            console.log(err)
        })
}

streamData()