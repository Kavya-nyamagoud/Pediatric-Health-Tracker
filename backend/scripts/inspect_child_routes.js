const childRoutes = require('../routes/childRoutes');
console.log('Child router exported keys:', Object.keys(childRoutes));
if (childRoutes && childRoutes.stack) {
  console.log('Router stack:');
  childRoutes.stack.forEach((layer, i) => {
    const route = layer.route;
    if (route) {
      console.log(i, 'route path:', route.path, 'methods:', route.methods);
    } else if (layer.name === 'router') {
      console.log(i, 'nested router layer');
    } else {
      console.log(i, 'layer:', layer.name || layer.handle && layer.handle.name || '<anon>');
    }
  });
} else {
  console.log('No stack found on router');
}
