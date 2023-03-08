<?php

namespace App\Controller;

use App\Entity\ClinicUsers;
use App\Entity\ProductNotes;
use App\Entity\Products;
use Doctrine\ORM\EntityManagerInterface;
use Nzo\UrlEncryptorBundle\Encryptor\Encryptor;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class ProductNotesController extends AbstractController
{
    private $em;
    private $encryptor;

    public function __construct(EntityManagerInterface $em, Encryptor $encryptor) {

        $this->em = $em;
        $this->encryptor = $encryptor;
    }

    private function noteCreateNew($productId)
    {
        return '
            <div 
                class="row hidden create-new-note"
            >
                <div class="col-12 mb-4">
                    <form 
                        name="form_note_'. $productId .'" 
                        class="form_note" id="form_note_'. $productId .'" 
                        method="post"  data-product-id="'. $productId .'"
                        data-action="submit->products--notes#onSubmitNotesForm"
                    >
                        <input type="hidden" name="product-id" value="'. $productId .'">
                        <input type="hidden" name="note-id" id="note_id_'. $productId .'" value="0">
                        <div class="row">
                            <div class="col-12 mb-3 mb-sm-0">
                                <div class="input-group">
                                    <input type="text" name="note" id="note_'. $productId .'" class="form-control">
                                    <button type="submit" class="btn btn-primary">
                                        ADD NEW NOTE
                                    </button>
                                </div>
                                <div class="hidden_msg" id="error_note_'. $productId .'">
                                    Required Field
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
            <!-- Modal Delete Note -->
            <div class="modal fade" id="modal_note_delete" tabindex="-1" aria-labelledby="note_delete_label" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="note_delete_label">Delete Note</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-12 mb-0">
                                    Are you sure you would like to delete this note? This action cannot be undone.
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-primary btn-sm" data-bs-dismiss="modal">CANCEL</button>
                            <button 
                                type="submit" 
                                class="btn btn-danger btn-sm" 
                                id="delete_note" 
                                data-delete-note-id="" 
                                data-delete-product-id=""
                                data-action="click->products--notes#onClickDelete"
                            >DELETE</button>
                        </div>
                    </div>
                </div>
            </div>';
    }

    #[Route('/clinics/inventory/get-notes', name: 'inventory_get_notes')]
    public function clinicsGetNotesAction(Request $request): Response
    {
        $productId = (int) $request->request->get('id');
        $clinic = $this->get('security.token_storage')->getToken()->getUser()->getClinic();
        $product = $this->em->getRepository(Products::class)->find($productId);
        $productNotes = $this->em->getRepository(ProductNotes::class)->findBy([
            'clinic' => $clinic,
            'product' => $product,
        ]);

        $response = '
        <div class="row">
            <div class="col-12 col-sm-6">
                <h5 class="pb-3 pt-3">Item Notes</h5>
            </div>
            <div class="col-12 col-sm-6 text-end">
                <a 
                    href="" 
                    class="text-primary pt-3 d-inline-block"
                    data-action="click->products--notes#onClickCreateNewLink"
                >
                    <i class="far fa-square-plus fa-plus-square"></i>
                    &nbsp;Add New Note
                </a>
            </div>
        </div>';

        $response .= $this->noteCreateNew($productId);
        $i = 0;

        foreach($productNotes as $note)
        {
            $i++;
            $marginBottom = 'mb-4';

            if($i == count($productNotes))
            {
                $marginBottom = '';
            }

            $response .= '
            <div class="row note_'. $note->getId() .'">
                <div class="col-9">
                    <h6>'. $note->getNote() .'</h6>
                </div>
                <div class="col-3">
                    <a 
                        href="" 
                        class="float-end note_update" 
                        data-id="'. $note->getId() .'"
                        data-action="click->products--notes#onClickUpdateNote"
                    >
                        <i class="fa-solid fa-pencil"></i>
                    </a>
                    <a 
                        href="" 
                        class="delete-icon float-end" 
                        data-bs-toggle="modal" data-note-id="'. $note->getId() .'" 
                        data-product-id="'. $product->getId() .'" 
                        data-bs-target="#modal_note_delete" 
                        id="note_delete_'. $note->getId() .'"
                        data-action="click->products--notes#onClickDeleteIcon"
                    >
                        <i class="fa-solid fa-trash-can"></i>
                    </a>
                </div>
            </div>
            <div class="row '. $marginBottom .' note_'. $note->getId() .'">
                <div class="col-12 info-sm">
                    '. $this->encryptor->decrypt($note->getClinicUser()->getFirstName()) .' '. $this->encryptor->decrypt($note->getClinicUser()->getLastName()) .' . '. $note->getCreated()->format('M d Y H:i') .'
                </div>
            </div>';
        }

        return new JsonResponse($response);
    }

    #[Route('/clinics/inventory/manage-note', name: 'inventory_manage_note')]
    public function clinicsManageNoteAction(Request $request): Response
    {
        $data = $request->request;
        $clinic = $this->get('security.token_storage')->getToken()->getUser()->getClinic();
        $product = $this->em->getRepository(Products::class)->find($data->get('product-id'));
        $delete = $data->get('delete-id');
        $noteId = (int) $data->get('note-id');

        if($delete)
        {
            $note = $this->em->getRepository(ProductNotes::class)->find($noteId);

            $this->em->remove($note);
            $this->em->flush();
        }
        else
        {
            $userName = $this->get('security.token_storage')->getToken()->getUser()->getUserIdentifier();
            $clinicUser = $this->em->getRepository(ClinicUsers::class)->findBy(['email' => $userName]);

            $noteString = $data->get('note');

            // List
            if ($noteId == 0)
            {
                $note = new ProductNotes();
            }
            else
            {
                $note = $this->em->getRepository(ProductNotes::class)->find($noteId);
            }

            $note->setProduct($product);
            $note->setClinic($clinic);
            $note->setClinicUser($clinicUser[0]);
            $note->setNote($noteString);

            $this->em->persist($note);
            $this->em->flush();
        }

        // Get the updated list
        $productNotes = $this->em->getRepository(ProductNotes::class)->findBy([
            'clinic' => $clinic,
            'product' => $product,
        ]);
        $response = '
        <div class="row">
            <div class="col-12 col-sm-6">
                <h5 class="pb-3 pt-3">Item Notes</h5>
            </div>
            <div class="col-12 col-sm-6 text-end">
                <a 
                    href="" 
                    class="text-primary pt-3 d-inline-block"
                    data-action="click->products--notes#onClickCreateNewLink"
                >
                    <i class="far fa-square-plus fa-plus-square"></i>
                    &nbsp;Add New Note
                </a>
            </div>
        </div>';

        $response .= $this->noteCreateNew($product->getId());
        $i = 0;

        foreach($productNotes as $note)
        {
            $i++;
            $marginBottom = 'mb-4';

            if($i == count($productNotes))
            {
                $marginBottom = '';
            }

            $response .= '
            <div class="row">
                <div class="col-10">
                    <h6>'. $note->getNote() .'</h6>
                </div>
                <div class="col-2">
                    <a 
                        href="" 
                        class="float-end note_update" 
                        data-id="'. $note->getId() .'"
                        data-action="click->products--notes#onClickUpdateNote"
                    >
                        <i class="fa-solid fa-pencil"></i>
                    </a>
                    <a 
                        href="" 
                        class="delete-icon float-end" 
                        data-bs-toggle="modal" 
                        data-note-id="'. $note->getId() .'" 
                        data-product-id="'. $product->getId() .'" 
                        data-bs-target="#modal_note_delete" 
                        id="note_delete_'. $note->getId() .'"
                        data-action="click->products--notes#onClickDeleteIcon"
                    >
                        <i class="fa-solid fa-trash-can"></i>
                    </a>
                </div>
            </div>
            <div class="row '. $marginBottom .'">
                <div class="col-12 info-sm">
                    '. $this->encryptor->decrypt($note->getClinicUser()->getFirstName()) .' '. $this->encryptor->decrypt($note->getClinicUser()->getLastName()) .' . '. $note->getCreated()->format('M d Y H:i') .'
                </div>
            </div>';
        }

        return new JsonResponse($response);
    }

    #[Route('/clinics/inventory/get-note', name: 'inventory_get_note')]
    public function clinicsGetNoteAction(Request $request): Response
    {
        $note = $this->em->getRepository(ProductNotes::class)->find($request->request->get('id'));

        $response = [
            'note' => $note->getNote(),
            'productId' => $note->getProduct()->getId(),
        ];

        return new JsonResponse($response);
    }

    #[Route('/clinics/get-product-notes', name: 'clinic_get_product_notes')]
    public function clinicGetProductNotes(Request $request): Response
    {
        $productId = $request->request->get('product-id');
        $clinicId = $this->get('security.token_storage')->getToken()->getUser()->getClinic()->getId();
        $notes = $this->em->getRepository(ProductNotes::class)->findNotes($productId, $clinicId);
        $noteCount = $this->em->getRepository(ProductNotes::class)->findBy([
            'product' => $productId,
            'clinic' => $clinicId,
        ]);

        $response = false;

        if(!empty($notes)) {

            $response = [
                'note' => $notes[0]->getNote(),
                'from' => $this->encryptor->decrypt($notes[0]->getClinicUser()->getFirstName()) .' '. $this->encryptor->decrypt($notes[0]->getClinicUser()->getLastName()),
                'noteCount' => count($noteCount),
            ];
        }

        return new JsonResponse($response);
    }
}
