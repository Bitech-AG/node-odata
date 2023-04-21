import * as uuid from 'uuid';

/*eslint-disable */
export default function (schema) {
  // display value of _id when request id.
  if (!schema.paths.id) {
    schema.virtual('id').get(function getId() {
      return this._doc._id;
    });
    schema.set('toObject', { virtuals: true });
    schema.set('toJSON', { virtuals: true });
  }

  // reomove _id when serialization.
  if (!schema.options.toObject) {
    schema.options.toObject = {};
  }
  if (!schema.options.toJSON) {
    schema.options.toJSON = {};
  }
  const remove = (doc, ret) => {
    delete ret._id;
    if (!ret.id) {
      delete ret.id;
    }
    return ret;
  };
  schema.options.toObject.transform = remove;
  schema.options.toJSON.transform = remove;

  // genarate _id.
  schema.pre('save', function preSave(next) {
    if (this.isNew && !this._doc._id) {
      if (this.id) {
        // Use a user-defined id to save
        this._doc._id = this.id;
      } else {
        // Use uuid to save
        this._doc._id = uuid.v4();
      }
    }
    return next();
  });
}
/* eslint-enable */