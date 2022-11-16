<?php

namespace App\Controller;

use App\Entity\ClinicUsers;
use App\Entity\ProductReviewComments;
use App\Entity\ProductReviewLikes;
use App\Entity\ProductReviews;
use App\Entity\Products;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class ProductReviewsController extends AbstractController
{
    private $em;

    public function __construct(EntityManagerInterface $em) {
        $this->em = $em;
    }

    #[Route('clinics/create-review', name: 'create_review')]
    public function createReviewAction(Request $request): Response
    {
        $data = $request->request;
        $product = $this->em->getRepository(Products::class)->find((int) $data->get('review_product_id'));
        $userName = $this->get('security.token_storage')->getToken()->getUser()->getUserIdentifier();
        $user = $this->em->getRepository(ClinicUsers::class)->findBy(['email' => $userName]);
        $clinic = $this->get('security.token_storage')->getToken()->getUser()->getClinic();
        $review = new ProductReviews();

        $review->setClinicUser($user[0]);
        $review->setClinic($clinic->getClinicName());
        $review->setProduct($product);
        $review->setSubject($data->get('review_title'));
        $review->setReview($data->get('review'));
        $review->setRating($data->get('rating'));

        $this->em->persist($review);
        $this->em->flush();

        $user[0]->setReviewUsername($data->get('review_username'));

        $this->em->persist($user[0]);
        $this->em->flush();

        $response = '<b><i class="fa-solid fa-circle-check"></i></i></b> Review Submitted.<div class="flash-close"><i class="fa-solid fa-xmark"></i></div>';

        return new JsonResponse($response);
    }

    #[Route('clinics/get-reviews/{product_id}', name: 'get_reviews')]
    public function getReviewsAction(Request $request): Response
    {
        $productId = $request->get('product_id');

        $review = $this->em->getRepository(ProductReviews::class)->getAverageRating($productId);

        $response = [
            'review_count' => $review[0][2],
            'review_average' => number_format($review[0][1],1)
        ];

        return new JsonResponse($response);
    }

    #[Route('clinics/get-reviews-on-load/{product_id}', name: 'get_reviews_on_load')]
    public function getReviewsOnLoadAction(Request $request): Response
    {
        $productId = $request->get('product_id');

        $review = $this->em->getRepository(ProductReviews::class)->getAverageRating($productId);

        $response = '<div id="review_count_'. $productId .'" class="d-inline-block">'. $review[0][2] .' Reviews</div>';
        $response .= "<script>rateStyle('". number_format($review[0][1],1) ."', 'parent_". $productId ."');</script>";

        return new Response($response);
    }

    #[Route('clinics/get-review-details/{product_id}', name: 'get_review_details')]
    public function getReviewDetailsAction(Request $request): Response
    {
        if($request->request->get('product_id') == null) {

            $productId = $request->get('product_id');
            $limit = 3;

        } else {

            $productId = $request->get('product_id');
            $limit = 100;
        }
        $productReview = $this->em->getRepository(ProductReviews::class)->findBy([
            'product' => $productId,
            'clinicUser' => $this->getUser()->getId()
        ]);
        $product = $this->em->getRepository(Products::class)->find($productId);
        $reviews = $this->em->getRepository(ProductReviews::class)->findBy(['product' => $product],['id' => 'DESC'], $limit);
        $rating1 = $this->em->getRepository(ProductReviews::class)->getProductRating($product->getId(),1);
        $rating2 = $this->em->getRepository(ProductReviews::class)->getProductRating($product->getId(),2);
        $rating3 = $this->em->getRepository(ProductReviews::class)->getProductRating($product->getId(),3);
        $rating4 = $this->em->getRepository(ProductReviews::class)->getProductRating($product->getId(),4);
        $rating5 = $this->em->getRepository(ProductReviews::class)->getProductRating($product->getId(),5);
        $response = '
        <div class="row">
            <div class="col-12" id="review_details_container">
                <h5 class="pb-3 pt-3">Reviews</h5><h6 class="pb-4 recent-reviews">Showing the 3 most recent reviews</h6>
        ';
        $writeReview = '';

        if($productReview != null){

            $writeReview = 'btn-secondary disabled';
        }

        if(empty($rating1)){

            $rating1[0]['total'] = 0;
        }

        if(empty($rating2)){

            $rating2[0]['total'] = 0;
        }

        if(empty($rating3)){

            $rating3[0]['total'] = 0;
        }

        if(empty($rating4)){

            $rating4[0]['total'] = 0;
        }

        if(empty($rating5)){

            $rating5[0]['total'] = 0;
        }

        $total = $rating1[0]['total'] + $rating2[0]['total'] + $rating3[0]['total'] + $rating4[0]['total'] + $rating5[0]['total'];

        $star1 = 0;
        $star2 = 0;
        $star3 = 0;
        $star4 = 0;
        $star5 = 0;

        if($rating1[0]['total'] > 0){

            $star1 = round($rating1[0]['total'] / $total * 100);
        }

        if($rating2[0]['total'] > 0){

            $star2 = round($rating2[0]['total'] / $total * 100);
        }

        if($rating3[0]['total'] > 0){

            $star3 = round($rating3[0]['total'] / $total * 100);
        }

        if($rating4[0]['total'] > 0){

            $star4 = round($rating4[0]['total'] / $total * 100);
        }

        if($rating5[0]['total'] > 0){

            $star5 = round($rating5[0]['total'] / $total * 100);
        }

        if($reviews != null) {

            $response .= '
            <div class="row">
                <div class="col-12 col-sm-6 text-center">
                    <div class="star-raiting-container">
                        <div class="star-rating-col-sm info">
                            5 Star
                        </div>
                        <div class="star-rating-col-lg info">
                            <div class="progress-outer">
                                <div class="progress-inner" style="width: '. $star5 .'%;"></div>
                            </div>
                        </div>
                        <div class="star-rating-col-sm info text-start">
                            '. $star5 .'%
                        </div>
                    </div>
                    <div class="star-raiting-container">
                        <div class="star-rating-col-sm info">
                            4 Star
                        </div>
                        <div class="star-rating-col-lg info">
                            <div class="progress-outer">
                                <div class="progress-inner" style="width: '. $star4 .'%;"></div>
                            </div>
                        </div>
                        <div class="star-rating-col-sm info text-start">
                            '. $star4 .'%
                        </div>
                    </div>
                    <div class="star-raiting-container">
                        <div class="star-rating-col-sm info">
                            3 Star
                        </div>
                        <div class="star-rating-col-lg info">
                            <div class="progress-outer">
                                <div class="progress-inner" style="width: '. $star3 .'%;"></div>
                            </div>
                        </div>
                        <div class="star-rating-col-sm info text-start">
                            '. $star3 .'%
                        </div>
                    </div>
                    <div class="star-raiting-container">
                        <div class="star-rating-col-sm info">
                            2 Star
                        </div>
                        <div class="star-rating-col-lg info">
                            <div class="progress-outer">
                                <div class="progress-inner" style="width: '. $star2 .'%;"></div>
                            </div>
                        </div>
                        <div class="star-rating-col-sm info text-start">
                            '. $star2 .'%
                        </div>
                    </div>
                    <div class="star-raiting-container">
                        <div class="star-rating-col-sm info">
                            1 Star
                        </div>
                        <div class="star-rating-col-lg info">
                            <div class="progress-outer">
                                <div class="progress-inner" style="width: '. $star1 .'%;"></div>
                            </div>
                        </div>
                        <div class="star-rating-col-sm info text-start">
                            '. $star1 .'%
                        </div>
                    </div>
                </div>
                <div class="col-12 col-sm-6 text-center pt-4 pb-4 pt-sm-0 pb-sm-0">
                    <h6>Help other Fluid clinics</h6>
                    <p>Let thousands of veterinary purchasers know about<br> your experience with this product</p>
                    <a 
                        href="" 
                        class="btn btn-primary btn_create_review w-sm-100 '. $writeReview .'" 
                        data-bs-toggle="modal" data-product-id="'. $productId .'" 
                        data-bs-target="#modal_review">
                        WRITE A REVIEW
                    </a>
                </div>
            </div>';

            $c = 0;

            foreach ($reviews as $review) {

                $c++;

                $productReviewComments = $this->em->getRepository(ProductReviewComments::class)->findBy([
                    'review' => $review->getId()
                ]);
                $productReviewLikes = $this->em->getRepository(ProductReviewLikes::class)->findBy([
                    'productReview' => $review->getId(),
                    'clinicUser' => $this->getUser()->getId(),
                ]);

                if(count($productReviewLikes) == 1){

                    $likeIcon = 'text-secondary';

                } else {

                    $likeIcon = 'list-icon-unchecked';
                }

                $likeCount = $this->em->getRepository(ProductReviewLikes::class)->findBy([
                    'productReview' => $review->getId()
                ]);

                $response .= '
                <div class="row">
                    <div class="col-12">
                        <div class="mb-3 mt-2 d-inline-block">
                ';

                for($i = 0; $i < $review->getRating(); $i++){

                    $response .= '<i class="star star-over fa fa-star star-visible position-relative start-sm-over"></i>';
                }

                for($i = 0; $i < (5 - $review->getRating()); $i++) {

                    $response .= '<i class="star star-under fa fa-star"></i>';
                }

                $commentCount = '';

                if(count($productReviewComments) > 0){

                    $commentCount = ' ('. count($productReviewComments) .')';
                }

                $viewAllReviews = '';

                if(count($reviews) == $c){

                    $viewAllReviews = '
                    <button 
                        class="btn btn-sm btn-white float-end info btn-view-all-reviews"
                        data-product-id="'. $productId .'"
                    >
                        View All Reviews
                    </button>';
                }

                $response .='    
                </div>
                    </div>
                    </div>
                    <div class="row">
                        <div class="col-12 mb-2">
                            <h6>'. $review->getSubject() .'</h6>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-12 mb-2">
                            Written on '. $review->getCreated()->format('d M Y') .' by <b>'. $review->getClinicUser()->getReviewUsername() .', '. $review->getPosition() .'</b>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-12">
                            <p>' . $review->getReview() . '</p>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-12 review-comments-row">
                            <button 
                                class="btn btn-sm btn-white review-like me-3 '. $likeIcon .'" 
                                id="like_'. $review->getId() .'" 
                                data-review-id="'. $review->getId() .'"
                            >
                                <i class="fa-solid fa-thumbs-up review-icon me-2 '. $likeIcon .'"></i> '. count($likeCount) .'
                            </button>
                            <button 
                                class="btn btn-sm btn-white btn-comment me-3" 
                                data-review-id="'. $review->getId() .'"
                                id="btn_comment_'. $review->getId() .'"
                            >
                                <i 
                                    class="fa-solid fa-comment review-icon review-icon me-2 list-icon-unchecked"
                                     id="comment_icon_'. $review->getId() .'"
                                ></i> 
                                <span class="list-icon-unchecked" id="comment_span_'. $review->getId() .'">
                                    <span class="d-none d-sm-inline">Comments </span>'. $commentCount .'
                                </span>
                            </button>
                            '. $viewAllReviews .'
                        </div>
                    </div>
                    <div class="row comment-container hidden" id="comment_container_'. $review->getId() .'">
                        <div class="col-12">
                            <div class="mb-5">
                                <form name="form-comment" class="form-comment" data-review-id="'. $review->getId() .'" method="post">
                                    <input type="hidden" name="review_id" value="'. $review->getId() .'">
                                    <div class="row">
                                        <div class="col-12 col-sm-10">
                                            <input 
                                                type="text" 
                                                name="comment"
                                                id="comment_'. $review->getId() .'"
                                                class="form-control d-inline-block" 
                                                placeholder="Leave a comment on this review..."
                                            >
                                            <div class="hidden_msg" id="error_comment_'. $review->getId() .'">
                                                Required Field
                                            </div>
                                        </div>
                                        <div class="col-12 col-sm-2">
                                            <button 
                                                type="submit" 
                                                class="btn btn-primary d-inline-block w-sm-100 mt-3 mt-sm-0" 
                                                data-review-id="'. $review->getId() .'">
                                                COMMENT
                                            </button>
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-12" id="review_comments_'. $review->getId() .'">';

                                        if(count($productReviewComments) > 0) {

                                            foreach ($productReviewComments as $comment) {

                                                $response .= '
                                                <div class="row mt-4">
                                                    <div class="col-12">
                                                        <b>' . $comment->getClinic()->getClinicUsers()[0]->getReviewUsername() . '</b> 
                                                        ' . $comment->getClinic()->getClinicUsers()[0]->getPosition() . ' '. $comment->getCreated()->format('dS M Y H:i') .'
                                                    </div>
                                                    <div class="col-12">
                                                        ' . $comment->getComment() . '
                                                    </div>
                                                </div>';
                                            }
                                        }

                                        $response .= '
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>';
            }
        } else {

            $response = '
            <div class="row">
                <div class="col-12 text-center pt-4 pb-4">
                    <h6>Help other Fluid clinics</h6>
                    <p>Let thousands of veterinary purchasers know about<br> your experience with this product</p>
                    <a 
                        href="" 
                        class="btn btn-primary btn_create_review w-sm-100 '. $writeReview .'" 
                        data-bs-toggle="modal" data-product-id="'. $productId .'" 
                        data-bs-target="#modal_review">
                        WRITE A REVIEW
                    </a>
                </div>
            </div>';
        }

        $response .='
            </div>
        </div>';

        if($product->getForm() == 'Each'){

            $dosage = $product->getSize() . $product->getUnit();

        } else {

            $dosage = $product->getDosage() . $product->getUnit();
        }

        $json = [
            'response' => $response,
            'product_name' => $product->getName() .' '. $dosage,
        ];

        return new JsonResponse($json);
    }

    #[Route('clinics/like-review', name: 'like_review')]
    public function likeReviewAction(Request $request): Response
    {
        $data = $request->request;
        $reviewId = $data->get('review_id');

        $user = $this->getUser()->getId();
        $productReview = $this->em->getRepository(ProductReviews::class)->find($reviewId);
        $productReviewLikes = $this->em->getRepository(ProductReviewLikes::class)->findBy([
            'productReview' => $reviewId,
            'clinicUser' => $user
        ]);
        $prc = $productReviewLikes;

        if(count($productReviewLikes) == 0){

            $productReviewLikes = new ProductReviewLikes();

            $productReviewLikes->setClinicUser($this->getUser());
            $productReviewLikes->setProductReview($productReview);

            $this->em->persist($productReviewLikes);

            $response = '<i class="fa-solid fa-thumbs-up text-secondary review-icon me-2"></i>';

        } else {

            $productReviewLikes = $this->em->getRepository(ProductReviewLikes::class)->find($productReviewLikes[0]->getId());
            $this->em->remove($productReviewLikes);

            $response = '<i class="fa-solid fa-thumbs-up list-icon-unchecked review-icon me-2"></i>';
        }

        $this->em->flush();

        $likeCount = $this->em->getRepository(ProductReviewLikes::class)->findBy([
            'productReview' => $reviewId
        ]);

        if(count($prc) == 0){

            $response .= '<span class="text-secondary">'. (int) count($likeCount) .'</span>';

        } else {

            $response .= '<span class="list-icon-unchecked">'. (int) count($likeCount) .'</span>';
        }

        return new JsonResponse($response);
    }

    #[Route('/clinics/manage-comment', name: 'inventory_manage_comment')]
    public function clinicsManageCommentAction(Request $request): Response
    {
        $data = $request->request;
        $reviewId = $data->get('review_id');

        if($reviewId > 0) {

            $review = $this->em->getRepository(ProductReviews::class)->find($reviewId);
            $reviewComment = new ProductReviewComments();

            $reviewComment->setClinicUser($this->getUser());
            $reviewComment->setClinic($this->getUser()->getClinic());
            $reviewComment->setReview($review);
            $reviewComment->setComment($data->get('comment'));

            $this->em->persist($reviewComment);
            $this->em->flush();
        }

        $reviewComments = $this->em->getRepository(ProductReviewComments::class)->findBy([
            'review' => $reviewId
        ]);

        $response = '';

        if(count($reviewComments) > 0) {

            foreach ($reviewComments as $comment) {

                $response .= '
                <div class="row mt-4">
                    <div class="col-12">
                        <b>' . $comment->getClinic()->getClinicUsers()[0]->getReviewUsername() . '</b> 
                        ' . $comment->getClinic()->getClinicUsers()[0]->getPosition() . ' '. $comment->getCreated()->format('dS M Y H:i') .'
                    </div>
                    <div class="col-12">
                        ' . $comment->getComment() . '
                    </div>
                </div>';
            }
        }

        return new JsonResponse($response);
    }

    #[Route('/clinics/get-comment-count', name: 'get_comment_count')]
    public function clinicsGetCommentCountAction(Request $request): Response
    {
        $data = $request->request;
        $reviewId = $data->get('review_id');
        $response = '';

        if($reviewId > 0) {

            $reviewComments = $this->em->getRepository(ProductReviewComments::class)->findBy([
                'review' => $reviewId
            ]);

            if(count($reviewComments) > 0) {

                $response = ' ('. count($reviewComments) .')';
            }
        }

        return new JsonResponse($response);
    }
}