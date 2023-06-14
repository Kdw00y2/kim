const { Post, Hashtag } = require('../models');

exports.afterUploadImage = (req, res) => {
  console.log(req.file);
  res.json({ url: `/img/${req.file.filename}` });
};

exports.uploadPost = async (req, res, next) => {
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
};

exports.deletePost = async (req, res, next) => {
  try {
    const postId = req.params.postId;
    const userId = req.user.id;

    // 게시글 삭제 전에 게시글의 작성자를 확인하여 권한을 검사합니다.
    const post = await Post.findOne({ where: { id: postId, UserId: userId } });
    if (!post) {
      // 권한이 없는 경우 403 Forbidden 응답을 반환합니다.
      return res.status(403).send('게시글을 삭제할 권한이 없습니다.');
    }

    // 게시글 삭제 로직을 구현하십시오.
    // 데이터베이스에서 해당 postId를 가진 게시글을 찾아 삭제하는 코드 등을 작성합니다.

    res.send('게시글이 삭제되었습니다.');
  } catch (error) {
    console.error(error);
    next(error);
  }
};
