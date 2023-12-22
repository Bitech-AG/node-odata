export default function(req) {
  switch (req.query.$count) {
  case 'true':
    return true;

  case 'false':
    return false;

  case undefined:
    return undefined;

  default:
    throw new Error('Unknown $count option, only "true" and "false" are supported.');
  }
}