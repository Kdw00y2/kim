const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { afterUploadImage, uploadPost, deletePost } = require('../controllers/post');
const { isLoggedIn } = require('../middlewares');
const { Post, Hashtag } = require('../models');

const router = express.Router();

// uploads 폴더가 없으면 생성
try {
  fs.readdirSync('uploads');
} catch (error) {
  console.error('uploads 폴더가 없어 생성합니다.');
  fs.mkdirSync('uploads');
}

const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, 'uploads/');
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname);
      cb(null, path.basename(file.originalname, ext) + Date.now() + ext);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// POST /post/img
router.post('/img', isLoggedIn, upload.single('img'), afterUploadImage);

// POST /post
const upload2 = multer();
router.post('/', isLoggedIn, upload2.none(), async (req, res, next) => {
  try {
    const post = await Post.create({
      content: req.body.content,
      img: req.body.url,
      UserId: req.user.id,
    });

    const hashtags = req.body.content.match(/#[^\s#]*/g); // 해시태그를 정규표현식으로 추출

    if (hashtags) {
      const result = await Promise.all(
        hashtags.map((tag) => {
          return Hashtag.findOrCreate({
            where: { title: tag.slice(1).toLowerCase() },
          });
        })
      );
      await post.addHashtags(result.map((r) => r[0]));
    }

    res.redirect('/');
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// DELETE /post/:postId
router.delete('/:postId', isLoggedIn, async (req, res, next) => {
  try {
    const postId = req.params.postId;

    // 게시글 삭제 권한 확인
    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).send('게시글을 찾을 수 없습니다.'); // 게시글이 없을 경우 404 오류 반환
    }

    if (post.UserId !== req.user.id) {
      return res.status(403).send('게시글 삭제 권한이 없습니다.'); // 게시글 작성자가 아닌 경우 403 오류 반환
    }

    // 게시글 삭제 로직을 구현하십시오.
    await Post.destroy({ where: { id: postId } });

    res.send('게시글이 삭제되었습니다.');
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;

