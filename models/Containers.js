import mongoose from 'mongoose';
import {
  randomBytes
} from 'crypto';

const mediaSchema = new mongoose.Schema({
  description: {
    type: String
  },
  url: {
    type: String, required: true
  }
}, {
  _id: false
});

const textDisplaySchema = new mongoose.Schema({
  content: {
    type: String, required: true
  }
}, {
  _id: false
});

const mediaGallerySchema = new mongoose.Schema({
  urls: {
    type: [String],
    validate: [v => v.length > 0, 'Media gallery must contain at least one URL']
  }
}, {
  _id: false
});

const sectionSchema = new mongoose.Schema({
  textDisplays: {
    type: [textDisplaySchema],
    validate: [v => v.length === 1, 'Section must contain exactly one text display']
  },
  media: {
    type: mediaSchema,
    required: false
  }
}, {
  _id: false
});

const componentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['text', 'section', 'separator', 'media'],
    required: true
  },
  text: {
    type: textDisplaySchema,
    required: function () {
      return this.type === 'text';
    }
  },
  media: {
    type: mediaGallerySchema,
    required: function () {
      return this.type === 'media';
    }
  },
  section: {
    type: sectionSchema,
    required: function () {
      return this.type === 'section';
    }
  }
}, {
  _id: false
});

const containerSchema = new mongoose.Schema({
  server: {
    type: String, required: true
  },
  name: {
    type: String, required: true, unique: true
  },
  id: {
    type: String,
    unique: true,
    default: () => randomBytes(4).toString('hex')
    },
    on: {
      type: String,
      enum: ['join', 'boost', 'leave', 'respond', 'default'],
      required: true
    },
    content: {
      type: String,
    default: null
    },
    file: {
      type: String,
    default: null
    },
    accentColor: {
      type: Number, default: 0x00ff00
    },
    components: {
      type: [componentSchema],
    default: []
    },
    createdBy: {
      type: String, required: true
    },
    channelId: {
      type: String
    },
    isTemporary: {
      type: Boolean, default: false
    },
    createdAt: {
      type: Date, default: Date.now
    },
    expiresAt: {
      type: Date,
      index: {
        expireAfterSeconds: 0
      }
    }
  });

  const ContainerMessage = mongoose.model('ContainerMessage', containerSchema);
  export default ContainerMessage;