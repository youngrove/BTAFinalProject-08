const CracoLessPlugin = require('craco-less')
const { getThemeVariables } = require('antd/dist/theme')

module.exports = {
    plugins: [
        {
            plugin: CracoLessPlugin,
            options: {
                lessLoaderOptions: {
                    lessOptions: {
                        javascriptEnabled: true,
                        modifyVars: {
                            ...getThemeVariables({
                                dark: false,
                            }),
                            '@primary-color': '#390368',
                        },
                    },
                },
            },
        },
    ],
}
