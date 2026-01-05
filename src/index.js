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
    htmlTextRenderer,
} = lcjs

// General configuration for this data set
const config = {
    framesPerSecond: 20,
    frameIntervalMs: (0.5 * 1000) / 20,
    freqStartMHz: 920,
    freqEndMHz: 935,
    resolution: 1612,
    freqStepMHz: (935 - 920) / (1612 - 1),
    visibleFrameCount: 150,
}

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
        textRenderer: htmlTextRenderer,
        theme: Themes[new URLSearchParams(window.location.search).get('theme') || 'darkGold'] || undefined,
    })
    .setTitle('Scrolling Heatmap - No Aggregation')
    .setTitleMargin({ top: 10, bottom: 10 })
containerChart1.style.flex = '1'

// Setup progressive scrolling Axis
chart1.axisY
    .setScrollStrategy(AxisScrollStrategies.scrolling)
    .setTitle('History (Frames)')
    .setDefaultInterval((state) => ({
        start: state.dataMax ?? 0,
        end: (state.dataMax ?? 0) - config.visibleFrameCount,
        stopAxisAfter: false,
    }))
    .setPointerEvents(false)
    .setTickStrategy(AxisTickStrategies.Empty)
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
        textRenderer: htmlTextRenderer,
        // theme: Themes.darkGold
    })
    .setTitle('Scrolling Heatmap - Aggregation (Max)')
    .setTitleMargin({ top: 10, bottom: 10 })
containerChart2.style.flex = '1'

// Setup progressive scrolling Axis
chart2.axisY
    .setScrollStrategy(AxisScrollStrategies.scrolling)
    .setTitle('History (Frames)')
    .setDefaultInterval((state) => ({
        start: state.dataMax ?? 0,
        end: (state.dataMax ?? 0) - config.visibleFrameCount,
        stopAxisAfter: false,
    }))
    .setPointerEvents(false)
    .setTickStrategy(AxisTickStrategies.Empty)
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

const streamData = () => {
    fetch(document.head.baseURI + 'examples/assets/1708/spectrum_920_935.json')
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

            const A = Math.floor(min)
            const B = Math.ceil(max)

            const lut = new LUT({
                steps: regularColorSteps(A, B, theme.examples.coldHotColorPalette),
                units: 'dBm',
                interpolate: true,
            })
            const paletteFill = new PalettedFill({ lut, lookUpProperty: 'value' })
            heatmapSeries1.setFillStyle(paletteFill)
            heatmapSeries2.setFillStyle(paletteFill)

            let frameIndex = 0

            const interval = setInterval(() => {
                if (frameIndex >= data.length) {
                    // Loop the data set
                    frameIndex = 0
                }

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
